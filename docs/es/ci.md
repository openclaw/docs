---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Gráfico de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-07T13:13:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionadamente el alcance inteligente y despliegan el grafo completo para candidatas de release y validación amplia. Las lanes de Android siguen siendo opt-in mediante `include_android`. La cobertura de plugin solo para release vive en el workflow separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o mediante un dispatch manual explícito.

## Resumen de la pipeline

| Trabajo                         | Propósito                                                                                                            | Cuándo se ejecuta                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                     | Detectar cambios solo en docs, alcances cambiados, extensiones cambiadas y construir el manifiesto de CI             | Siempre en pushes y PRs no draft  |
| `security-scm-fast`             | Detección de claves privadas y auditoría de workflows mediante `zizmor`                                              | Siempre en pushes y PRs no draft  |
| `security-dependency-audit`     | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                           | Siempre en pushes y PRs no draft  |
| `security-fast`                 | Agregado requerido para los trabajos rápidos de seguridad                                                            | Siempre en pushes y PRs no draft  |
| `check-dependencies`            | Pasada de Knip solo para dependencias de producción, más el guard de allowlist de archivos no usados                 | Cambios relevantes para Node      |
| `build-artifacts`               | Construir `dist/`, Control UI, verificaciones de artefactos construidos y artefactos downstream reutilizables        | Cambios relevantes para Node      |
| `checks-fast-core`              | Lanes rápidas de corrección en Linux, como verificaciones bundled/plugin-contract/protocol                           | Cambios relevantes para Node      |
| `checks-fast-contracts-channels` | Verificaciones fragmentadas de contratos de canales con un resultado agregado estable                               | Cambios relevantes para Node      |
| `checks-node-core-test`         | Shards de pruebas de Node core, excluyendo lanes de canales, bundled, contract y extensiones                         | Cambios relevantes para Node      |
| `check`                         | Equivalente fragmentado del gate local principal: tipos prod, lint, guards, tipos de prueba y smoke estricto         | Cambios relevantes para Node      |
| `check-additional`              | Arquitectura, drift fragmentado de boundary/prompt, guards de extensiones, package boundary y gateway watch          | Cambios relevantes para Node      |
| `build-smoke`                   | Pruebas smoke de la CLI construida y smoke de memoria de arranque                                                    | Cambios relevantes para Node      |
| `checks`                        | Verificador para pruebas de canales de artefactos construidos                                                        | Cambios relevantes para Node      |
| `checks-node-compat-node22`     | Build de compatibilidad con Node 22 y lane smoke                                                                     | Dispatch manual de CI para releases |
| `check-docs`                    | Formato de docs, lint y verificaciones de enlaces rotos                                                              | Docs cambiados                    |
| `skills-python`                 | Ruff + pytest para skills respaldadas por Python                                                                     | Cambios relevantes para skills de Python |
| `checks-windows`                | Pruebas específicas de Windows para procesos/rutas, más regresiones compartidas de especificadores de importación runtime | Cambios relevantes para Windows   |
| `macos-node`                    | Lane de pruebas TypeScript en macOS usando los artefactos construidos compartidos                                    | Cambios relevantes para macOS     |
| `macos-swift`                   | Swift lint, build y pruebas para la app de macOS                                                                     | Cambios relevantes para macOS     |
| `android`                       | Pruebas unitarias de Android para ambos flavors, más una build de APK debug                                          | Cambios relevantes para Android   |
| `test-performance-agent`        | Optimización diaria de pruebas lentas de Codex tras actividad confiable                                              | Éxito de CI en main o dispatch manual |
| `openclaw-performance`          | Informes diarios/bajo demanda de rendimiento runtime de Kova con lanes mock-provider, deep-profile y GPT 5.4 live   | Programado y dispatch manual      |

## Orden fail-fast

1. `preflight` decide qué lanes existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matrices de plataformas.
3. `build-artifacts` se solapa con las lanes rápidas de Linux para que los consumidores downstream puedan empezar en cuanto la build compartida esté lista.
4. Las lanes más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Las verificaciones agregadas de shards usan `!cancelled() && always()` para que sigan informando fallos normales de shards, pero no se pongan en cola después de que todo el workflow ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en progreso.

El trabajo `ci-timings-summary` sube un artefacto compacto `ci-timings-summary` para cada ejecución de CI no draft. Registra tiempo de pared, tiempo en cola, trabajos más lentos y trabajos fallidos para la ejecución actual, de modo que las verificaciones de salud de CI no necesiten volver a extraer repetidamente todo el payload de Actions.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El dispatch manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Las ediciones del workflow de CI** validan el grafo de CI de Node más el linting de workflows, pero no fuerzan por sí solas builds nativas de Windows, Android o macOS; esas lanes de plataforma siguen limitadas a cambios en el código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas core, y ediciones estrechas de helpers/test-routing de contratos de plugin** usan una ruta rápida de manifiesto solo Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, shards core completos, shards de bundled-plugin y matrices adicionales de guards cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las verificaciones de Node en Windows** están limitadas a wrappers específicos de Windows para procesos/rutas, helpers de ejecución npm/pnpm/UI, configuración de package manager y las superficies del workflow de CI que ejecutan esa lane; los cambios no relacionados de código fuente, plugin, install-smoke y solo pruebas permanecen en las lanes de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin reservar runners de más: los contratos de canales se ejecutan como tres shards ponderados respaldados por Blacksmith con fallback al runner estándar de GitHub, las lanes core unit fast/support se ejecutan por separado, la infraestructura runtime core se divide entre shards de state, process/config, cron y shared, auto-reply se ejecuta como workers equilibrados (con el subtree de reply dividido en shards agent-runner, dispatch y commands/state-routing), y las configuraciones agentic gateway/server se dividen entre lanes chat/auth/model/http-plugin/runtime/startup en lugar de esperar a artefactos construidos. Las pruebas amplias de browser, QA, media y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards include-pattern registran entradas de timing usando el nombre del shard de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado. `check-additional` mantiene junto el trabajo de compilación/canary de package-boundary y separa la arquitectura de topología runtime de la cobertura de gateway watch; la lista de boundary guards se reparte en cuatro shards de matriz, cada uno ejecutando guards independientes seleccionados en paralelo e imprimiendo timings por verificación. La costosa verificación de drift del snapshot de prompt del happy-path de Codex se ejecuta como su propio trabajo adicional para CI manual y solo para cambios que afectan prompts, de modo que los cambios normales no relacionados de Node no esperen detrás de la generación fría de snapshots de prompt y los shards de boundary se mantengan equilibrados mientras el drift de prompts sigue fijado al PR que lo causó; la misma flag omite la generación de Vitest de snapshots de prompt dentro del shard core support-boundary de artefactos construidos. Gateway watch, las pruebas de canales y el shard core support-boundary se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y después construye el APK debug de Play. El flavor third-party no tiene source set ni manifest separados; su lane de pruebas unitarias aun así compila el flavor con las flags de BuildConfig de SMS/call-log, evitando al mismo tiempo un trabajo duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de release de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción no usados de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos no usados falla cuando un PR añade un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la allowlist, preservando al mismo tiempo superficies intencionales de plugins dinámicos, generadas, de build, live-test y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

La lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de ítem, URL, título, estado y extractos breves de comentarios o revisiones cuando existen. Evita intencionadamente reenviar el cuerpo completo del webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente de ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente de ClawSweeper recibe el destino de Discord en su prompt y debería publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operativamente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido de webhooks duplicados y tráfico normal de revisiones deberían resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de confirmación de GitHub como datos no confiables en toda esta ruta. Son entradas para resumen y triaje, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Despachos manuales

Los despachos manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de cada carril con alcance no Android: shards de Linux Node, shards de plugins incluidos, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Python skills, Windows, macOS e i18n de Control UI. Los despachos manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas de release completo habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de Plugin, el shard solo de release `agentic-plugins`, el barrido por lotes completo de extensiones y los carriles Docker de prerelease de plugins quedan excluidos de CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la compuerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de release no sea cancelada por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite que un invocador confiable ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de flujo de trabajo de la ref de despacho seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canal, shards de `check` excepto lint, agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Python skills, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                      |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de pruebas de Linux Node, shards de pruebas de plugins incluidos, shards de `check-additional`, `android`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

La CI del repositorio canónico mantiene Blacksmith como la ruta predeterminada de ejecutor. Durante `preflight`, `scripts/ci-runner-labels.mjs` comprueba ejecuciones recientes de Actions en cola y en progreso para trabajos Blacksmith en cola. Si una etiqueta específica de Blacksmith ya tiene trabajos en cola, los trabajos posteriores que usarían esa etiqueta exacta recurren al ejecutor alojado en GitHub correspondiente (`ubuntu-24.04`, `windows-2025` o `macos-latest`) solo para esa ejecución. Otros tamaños de Blacksmith en la misma familia de SO permanecen en sus etiquetas principales. Si la sonda de API falla, no se aplica ningún fallback.

## Equivalentes locales

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Rendimiento de OpenClaw

`OpenClaw Performance` es el flujo de trabajo de rendimiento de producto/runtime. Se ejecuta a diario en `main` y puede despacharse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente somete a benchmark la ref del flujo de trabajo. Establece `target_ref` para someter a benchmark una etiqueta de release u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la ref probada, y cada `index.md` registra la ref/SHA probada, la ref/SHA del flujo de trabajo, la ref de Kova, el perfil, el modo de autenticación de carril, el modelo, el recuento de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde un release fijado y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`; luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/traza para puntos críticos de arranque, Gateway y turnos de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después del pase de Kova: tiempos de arranque del Gateway y memoria en casos de inicio predeterminado, con hook y con 50 plugins; bucles hello repetidos de `channel-chat-baseline` con mock-OpenAI; y comandos de inicio de CLI contra el Gateway arrancado. El resumen Markdown de la sonda de código fuente vive en `source/index.md` dentro del paquete de informe, con JSON sin procesar al lado.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sonda de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la ref probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de release

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes del release". Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para pruebas de plugins/paquetes/estáticas/Docker solo de release, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre SO, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas mantienen la cobertura exhaustiva live/E2E y de ruta de release Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza la activación de esa cobertura de soak para que la validación amplia de avisos siga siendo amplia. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de release. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo carril de paquete de Telegram contra el paquete npm publicado.

Consulta [validación completa de release](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias entre perfiles, los artefactos y
los identificadores de reejecución enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de release. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de release y después de que
el preflight de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos los paquetes de plugins publicables, despacha
`Plugin ClawHub Release` para el mismo SHA de release y solo entonces despacha
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para obtener prueba de commit fijado en una rama que cambia rápidamente, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de dispatch de workflows de GitHub deben ser ramas o etiquetas, no SHAs de commits sin procesar. El
helper empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
despacha `Full Release Validation` desde esa ref fijada, verifica que cada
`headSha` de workflow hijo coincida con el objetivo y elimina la rama temporal cuando la
ejecución se completa. El verificador general también falla si algún workflow hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud live/proveedor que se pasa a los controles de release. Los
workflows manuales de release tienen `stable` como valor predeterminado; usa `full` solo cuando
quieras intencionadamente la matriz amplia consultiva de proveedores/medios. `run_release_soak`
controla si los controles de release stable/predeterminados ejecutan el soak exhaustivo live/E2E y
de ruta de release de Docker; `full` fuerza la activación del soak.

- `minimum` conserva las vías críticas de release más rápidas de OpenAI/core.
- `stable` añade el conjunto stable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El workflow general registra los ids de ejecuciones hijas despachadas, y el job final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de los jobs más lentos para cada ejecución hija. Si un workflow hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el job verificador padre para actualizar el resultado general y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de release, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prerelease de plugins, `release-checks` para cada hijo de release, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el workflow general. Esto mantiene acotada la repetición de una caja de release fallida después de una corrección enfocada. Para una vía cross-OS fallida, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Las vías QA de release-check son consultivas, por lo que los fallos solo de QA advierten pero no bloquean el verificador de release-check.

`OpenClaw Release Checks` usa la ref de workflow confiable para resolver una vez la ref seleccionada en un tarball `release-package-under-test`, luego pasa ese artefacto a los controles cross-OS y Package Acceptance, además del workflow Docker live/E2E de ruta de release cuando se ejecuta cobertura de soak. Eso mantiene coherentes los bytes del paquete entre cajas de release y evita volver a empaquetar el mismo candidato en varios jobs hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al workflow general más antiguo. El monitor padre cancela cualquier workflow hijo que
ya haya despachado cuando el padre se cancela, por lo que una validación más nueva de main
no queda detrás de una ejecución obsoleta de dos horas de release-check. La validación de ramas/etiquetas
de release y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de release mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de como un solo job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` filtrados por proveedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards separados de medios de audio/video y shards de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos mientras facilita repetir y diagnosticar fallos lentos de proveedores live. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola ejecución.

Los shards nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el workflow `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los jobs de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los jobs en contenedores no son el lugar adecuado para lanzar pruebas Docker anidadas.

Los shards live de modelos/backends respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El workflow live de release construye y empuja esa imagen una vez; luego los shards del modelo live de Docker, Gateway segmentado por proveedor, backend CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del job del workflow, de modo que un contenedor atascado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de release-check. Si esos shards reconstruyen independientemente todo el objetivo Docker de código fuente, la ejecución de release está mal configurada y desperdiciará tiempo de reloj en compilaciones duplicadas de imagen.

## Package Acceptance

Usa `Package Acceptance` cuando la pregunta sea “¿funciona este paquete instalable de OpenClaw como producto?”. Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que package acceptance valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la ref de workflow, la ref de paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El workflow reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest de paquete cuando es necesario y ejecuta las vías Docker seleccionadas contra ese paquete en lugar de empaquetar el checkout del workflow. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el workflow reutilizable prepara el paquete y las imágenes compartidas una vez y luego despliega esas vías como jobs Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el dispatch independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` falla el workflow si falló la resolución del paquete, la aceptación Docker o la vía opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de prereleases/stable publicados.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de `package_ref` confiable. El resolver obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o una etiqueta de release, instala dependencias en un worktree desacoplado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código confiable del workflow/arnés que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen confiables más antiguos sin ejecutar lógica de workflows antiguos.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos Docker de ruta de release con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins offline para que la validación de paquetes publicados no dependa de la disponibilidad live de ClawHub. La vía opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se mantiene para dispatches independientes.

Para la política dedicada de pruebas de actualizaciones y plugins, incluidos comandos locales,
vías Docker, entradas de Package Acceptance, valores predeterminados de release y triage de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Los controles de release llaman a Package Acceptance con `source=artifact`, el artefacto preparado del paquete de release, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la prueba de migración de paquetes, actualización, limpieza de dependencias obsoletas de plugins, reparación de instalación de plugins configurados, plugins offline, actualización de plugins y Telegram en el mismo tarball de paquete resuelto. Define `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm publicado en lugar del artefacto construido desde SHA. Los controles de release cross-OS aún cubren onboarding, instalador y comportamiento de plataforma específicos del SO; la validación de producto de paquete/actualización debería empezar con Package Acceptance. La vía Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta bloqueante de release. En Package Acceptance, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada alternativa, con valor predeterminado `openclaw@latest`; los comandos de repetición de vías fallidas conservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por las cuatro últimas releases stable de npm más releases fijadas de frontera de compatibilidad de plugins y fixtures con forma de incidencia para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de logs con tilde y raíces obsoletas de dependencias de plugins heredados. Las selecciones publicadas multi-línea base de upgrade survivor se dividen por línea base en jobs separados dirigidos de runner Docker. El workflow separado `Update Migration` usa la vía Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es la limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de Full Release CI. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar una sola vía con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La vía publicada configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz`, además del estado RPC después de iniciar Gateway. Las vías frescas empaquetadas e instalador de Windows también verifican que un paquete instalado pueda importar una anulación de control del navegador desde una ruta absoluta sin procesar de Windows. El smoke cross-OS de turno de agente OpenAI usa como valor predeterminado `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.4`, por lo que la prueba de instalación y Gateway permanece en un modelo de prueba GPT-5 mientras evita valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas delimitadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia de `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture falso de git derivado del tarball y puede registrar la falta de `update.channel` persistido;
- las pruebas smoke de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración sin dejar de exigir que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete `2026.4.26` publicado también puede advertir sobre archivos de sello de metadatos de compilación local que ya se habían enviado. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

### Ejemplos

```bash
# Validar el paquete beta actual con cobertura a nivel de producto.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Empaquetar y validar una rama de lanzamiento con el arnés actual.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validar una URL de tarball. SHA-256 es obligatorio para source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reutilizar un tarball cargado por otra ejecución de Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Luego inspecciona la ejecución secundaria de `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de lanes, tiempos de fases y comandos de reejecución. Prefiere reejecutar el perfil de paquete fallido o las lanes de Docker exactas en lugar de volver a ejecutar la validación completa de lanzamiento.

## Smoke de instalación

El workflow independiente `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios en paquetes/manifiestos de plugins incluidos, o superficies centrales de plugins/canales/Gateway/SDK de Plugin que ejercitan los jobs smoke de Docker. Los cambios solo de código fuente en plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila la imagen del Dockerfile raíz una vez, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes de espacio de trabajo compartido, ejecuta el e2e de red de Gateway del contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker delimitado de plugins incluidos bajo un tiempo de espera agregado de comando de 240 segundos (con cada ejecución de Docker de escenario limitada por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura Docker/de actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento con workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke GHCR del Dockerfile raíz con SHA objetivo, luego ejecuta la instalación de paquete QR, smokes del Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E Docker rápido de plugins incluidos como jobs separados, para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios pediría cobertura completa en un push, el workflow mantiene el smoke Docker rápido y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento de proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles enfocados en instalación.

## E2E Docker local

`pnpm test:docker:all` precompila una imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para lanes de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                       |
| -------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Cantidad de espacios del pool principal para lanes normales.                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Cantidad de espacios del pool final sensible al proveedor.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de lanes live concurrentes para que los proveedores no limiten el tráfico.                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de lanes concurrentes de instalación npm.                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de lanes multiservicio concurrentes.                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de lanes para evitar tormentas de creación del demonio de Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Tiempo de espera de respaldo por lane (120 minutos); ciertas lanes live/finales usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin establecer | `1` imprime el plan del programador sin ejecutar lanes.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin establecer | Lista exacta de lanes separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede empezar desde un pool vacío, y luego se ejecuta sola hasta liberar capacidad. Los preflights agregados locales verifican Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten el estado de lanes activas, persisten tiempos de lanes para ordenar primero las más largas y, de forma predeterminada, dejan de programar nuevas lanes agrupadas después del primer fallo.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, lane y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes Docker E2E básicas/funcionales de GHCR etiquetadas con el digest del paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita lanes con paquete instalado; y reutiliza entradas proporcionadas de `docker_e2e_bare_image`/`docker_e2e_functional_image` o imágenes existentes con digest de paquete en lugar de reconstruirlas. Las descargas de imágenes Docker se reintentan con un tiempo de espera delimitado de 180 segundos por intento, para que un flujo atascado del registro/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute varias lanes mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` permanecen como alias agregados de plugins/runtime. El alias de lane `install-e2e` permanece como el alias agregado de reejecución manual para ambas lanes de instalador de proveedor.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las lanes de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento carga `.artifacts/docker-tests/` con registros de lanes, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de lanes lentas y comandos de reejecución por lane. La entrada `docker_lanes` del workflow ejecuta las lanes seleccionadas contra las imágenes preparadas en lugar de los jobs por fragmento, lo que mantiene la depuración de lanes fallidas delimitada a un job Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una lane seleccionada es una lane Docker live, el job dirigido compila la imagen de pruebas live localmente para esa reejecución. Los comandos de reejecución de GitHub generados por lane incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, para que una lane fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # descargar artefactos Docker e imprimir comandos de reejecución dirigidos combinados/por lane
pnpm test:docker:timings <summary>   # resúmenes de lanes lentas y ruta crítica de fases
```

El workflow live/E2E programado ejecuta diariamente la suite Docker completa de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, así que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos entre ocho workers de extensiones; esos jobs de shards de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen jobs adicionales de CI. La ruta Docker de prelanzamiento solo para lanzamiento agrupa lanes Docker dirigidas en grupos pequeños para evitar reservar decenas de runners para jobs de uno a tres minutos.

## QA Lab

QA Lab tiene lanes de CI dedicadas fuera del workflow principal de alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no como un workflow independiente de PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba ir con una ejecución de validación amplia.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en despacho manual; distribuye la lane de paridad mock, la lane live de Matrix y las lanes live de Telegram y Discord como jobs paralelos. Los jobs live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan los carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como simulados (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia del modelo en vivo y del arranque normal del proveedor-plugin. El Gateway de transporte en vivo desactiva la búsqueda en memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad del proveedor está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, y agrega `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre fragmenta la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento de QA Lab antes de la aprobación del lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y de línea base como trabajos de carril paralelos, y luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

Para los PR normales, sigue la evidencia de CI/comprobación con alcance limitado en lugar de tratar la paridad como un estado obligatorio.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones de protección diarias, manuales y de pull request que no son borradores escanean el código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull request se mantiene ligera: solo empieza para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, Cron y línea base del Gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos principales de implementación de canales más el runtime de Plugin de canal, Gateway, Plugin SDK, secretos, puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies principales de SSRF, análisis de IP, protección de red, web-fetch y política SSRF del Plugin SDK                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, ayudantes de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente                |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y contrato de paquete del Plugin SDK |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila la app de Android manualmente para CodeQL en el runner Linux Blacksmith más pequeño aceptado por la cordura del workflow. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Compila la app de macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el runner Linux Blacksmith más pequeño. Su protección de pull request es intencionalmente más pequeña que el perfil programado: los PR que no son borradores solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, runtime de canal principal y Plugin de canal incluido, protocolo/método de servidor del Gateway, enlace de runtime de memoria/SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de Plugin, contrato de paquete/Plugin SDK o runtime de respuesta del Plugin SDK. Los cambios de configuración de CodeQL y del workflow de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, Cron y Gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo del Gateway y contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos principales de implementación de canal y Plugin de canal incluido                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de ejecución de comandos, despacho de modelo/proveedor, despacho y colas de respuesta automática, y plano de control ACP                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, ayudantes de supervisión de procesos y contratos de entrega saliente                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias de memoria del Plugin SDK, enlace de activación del runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de cola de respuestas, colas de entrega de sesión, ayudantes de enlace/entrega de sesión saliente, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, ayudantes de payload/fragmentación/runtime de respuesta, opciones de respuesta de canal, colas de entrega y ayudantes de enlace de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedor, valores predeterminados/catálogos de proveedor y registros de web/búsqueda/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la UI de control, persistencia local, flujos de control del Gateway y contratos de runtime del plano de control de tareas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos principales de runtime de fetch/búsqueda web, IO de medios, comprensión de medios, generación de imágenes y generación de medios                         |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada del Plugin SDK                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente publicada del Plugin SDK del lado del paquete y ayudantes de contrato de paquete de plugin                                                                  |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, desactivarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento con alcance limitado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es un carril de mantenimiento de Codex impulsado por eventos para mantener los docs existentes alineados con los cambios integrados recientemente. No tiene una programación pura: una ejecución de CI exitosa de un push que no es de bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones de workflow-run se omiten cuando `main` ya avanzó o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior de Docs Agent no omitido hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de docs.

### Test Performance Agent

El workflow `Test Performance Agent` es un carril de mantenimiento de Codex impulsado por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de un push que no es de bot en `main` puede activarlo, pero se omite si otra invocación de workflow-run ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa puerta de actividad diaria. El carril crea un informe de rendimiento de Vitest agrupado de suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el recuento de pruebas aprobadas de la línea base. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe aprobar antes de que se confirme nada. Cuando `main` avanza antes de que el push del bot aterrice, el carril rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado por GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de docs.

### PR duplicados después de merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedor para limpieza de duplicados posterior al aterrizaje. Su valor predeterminado es dry-run y solo cierra PR enumerados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación locales y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta con los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción y de pruebas del núcleo, además de lint/guards del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo la comprobación de tipos de pruebas del núcleo, además del lint del núcleo;
- los cambios de producción de extensiones ejecutan la comprobación de tipos de producción y de pruebas de extensiones, además del lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan la comprobación de tipos de pruebas de extensiones, además del lint de extensiones;
- los cambios públicos del Plugin SDK o del contrato de plugins se expanden a la comprobación de tipos de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones específicas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren asignaciones explícitas, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible para el grupo, el modo de entrega de respuestas de origen o el prompt del sistema de la herramienta de mensajes pasan por las pruebas de respuesta del núcleo, además de regresiones de entrega de Discord y Slack, para que un cambio compartido de valor predeterminado falle antes del primer envío de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo suficientemente amplio en el arnés como para que el conjunto barato asignado no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja nueva precalentada para pruebas amplias. Antes de gastar una puerta lenta en una caja que fue reutilizada, caducó o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de sanidad falla rápido cuando desaparecieron archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remoto no es una copia confiable del PR; detén esa caja y calienta una nueva en lugar de depurar la falla de la prueba del producto. Para PRs intencionales con grandes eliminaciones, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de sanidad.

`pnpm testbox:run` también termina una invocación local de Blacksmith CLI que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es el wrapper de cajas remotas propiedad del repositorio para pruebas Linux de mantenedores. Úsalo cuando una comprobación sea demasiado amplia para un bucle local de edición, cuando importe la paridad con CI, o cuando la prueba necesite secretos, Docker, carriles de paquetes, cajas reutilizables o logs remotos. El backend normal de OpenClaw es `blacksmith-testbox`; la capacidad AWS/Hetzner propia es una alternativa para caídas de Blacksmith, problemas de cuota o pruebas explícitas con capacidad propia.

Antes de una primera ejecución, revisa el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario Crabbox obsoleto que no anuncia `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia.

Puerta de cambios:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Reejecución de prueba enfocada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Suite completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Las ejecuciones únicas de Crabbox respaldadas por Blacksmith deberían detener el Testbox automáticamente; si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo las cajas que creaste:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa reutilización solo cuando necesites intencionalmente múltiples comandos en la misma caja hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directo como alternativa estrecha:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
precalentamientos quedan en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor Blacksmith, de cola, facturación o límites de la organización. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox de abajo mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar la cuota regional de EC2 Spot o On-Demand Standard. El `.crabbox.yaml` propiedad del repositorio usa por defecto `standard`, múltiples regiones de capacidad y `capacity.hints: true`, de modo que los arrendamientos AWS intermediados imprimen la región/mercado seleccionados, presión de cuota, alternativa Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para carriles excepcionales dependientes de CPU, como matrices Docker de suite completa o de todos los plugins, validación explícita de lanzamiento/bloqueo o perfilado de rendimiento de muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/comprobación de tipos ordinarios, pequeñas reproducciones E2E o triaje de caída de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, de modo que la inestabilidad del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` posee los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para carriles de nube propia. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/build que nunca deberían transferirse. `.github/workflows/crabbox-hydrate.yml` posee el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso del entorno no secreto para comandos `crabbox run --id <cbx_id>` de nube propia.

## Relacionado

- [Descripción general de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
