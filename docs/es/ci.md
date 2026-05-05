---
read_when:
    - Necesitas comprender por qué una tarea de CI se ejecutó o no
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o repetición de la validación de lanzamiento
    - Está cambiando el dispatch de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, puertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-05T01:44:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva los lanes costosos cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan todo el grafo para candidatos de lanzamiento y validación amplia. Los lanes de Android siguen siendo opcionales mediante `include_android`. La cobertura de Plugin exclusiva de lanzamiento vive en el workflow separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o mediante un dispatch manual explícito.

## Descripción general del pipeline

| Trabajo                         | Propósito                                                                                                      | Cuándo se ejecuta                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                     | Detecta cambios solo de documentación, alcances cambiados, extensiones cambiadas y construye el manifiesto de CI | Siempre en pushes y PRs que no son borrador |
| `security-scm-fast`             | Detección de claves privadas y auditoría de workflow mediante `zizmor`                                         | Siempre en pushes y PRs que no son borrador |
| `security-dependency-audit`     | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                     | Siempre en pushes y PRs que no son borrador |
| `security-fast`                 | Agregado requerido para los trabajos rápidos de seguridad                                                       | Siempre en pushes y PRs que no son borrador |
| `check-dependencies`            | Pasada de Knip solo de dependencias de producción más el guard de allowlist de archivos sin usar               | Cambios relevantes para Node               |
| `build-artifacts`               | Compila `dist/`, Control UI, comprobaciones de artefactos compilados y artefactos downstream reutilizables     | Cambios relevantes para Node               |
| `checks-fast-core`              | Lanes rápidos de corrección en Linux, como comprobaciones de bundled/plugin-contract/protocol                  | Cambios relevantes para Node               |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado agregado estable                         | Cambios relevantes para Node               |
| `checks-node-core-test`         | Shards de pruebas core de Node, excluyendo lanes de canales, bundled, contract y extensiones                   | Cambios relevantes para Node               |
| `check`                         | Equivalente fragmentado del gate local principal: tipos de prod, lint, guards, tipos de prueba y smoke estricto | Cambios relevantes para Node               |
| `check-additional`              | Arquitectura, drift fragmentado de boundary/prompt, guards de extensiones, límite de paquete y gateway watch   | Cambios relevantes para Node               |
| `build-smoke`                   | Pruebas smoke de CLI compilada y smoke de memoria de inicio                                                     | Cambios relevantes para Node               |
| `checks`                        | Verificador para pruebas de canal de artefactos compilados                                                     | Cambios relevantes para Node               |
| `checks-node-compat-node22`     | Lane de compilación y smoke de compatibilidad con Node 22                                                       | Dispatch manual de CI para lanzamientos    |
| `check-docs`                    | Formato, lint y comprobaciones de enlaces rotos de la documentación                                             | Documentación modificada                   |
| `skills-python`                 | Ruff + pytest para skills respaldadas por Python                                                               | Cambios relevantes para skills de Python   |
| `checks-windows`                | Pruebas específicas de Windows para procesos/rutas más regresiones compartidas de especificadores de importación runtime | Cambios relevantes para Windows            |
| `macos-node`                    | Lane de pruebas TypeScript de macOS usando los artefactos compilados compartidos                               | Cambios relevantes para macOS              |
| `macos-swift`                   | Swift lint, compilación y pruebas para la app de macOS                                                          | Cambios relevantes para macOS              |
| `android`                       | Pruebas unitarias de Android para ambos sabores más una compilación de APK debug                                | Cambios relevantes para Android            |
| `test-performance-agent`        | Optimización diaria de pruebas lentas de Codex después de actividad confiable                                  | Éxito de CI en main o dispatch manual      |
| `openclaw-performance`          | Informes diarios/bajo demanda de rendimiento runtime de Kova con lanes de mock-provider, deep-profile y GPT 5.4 live | Dispatch programado y manual               |

## Orden fail-fast

1. `preflight` decide qué lanes existen. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataforma.
3. `build-artifacts` se solapa con los lanes rápidos de Linux para que los consumidores downstream puedan empezar en cuanto la compilación compartida esté lista.
4. Los lanes más pesados de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando un push más nuevo llega al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más nueva para el mismo ref también esté fallando. Las comprobaciones agregadas de shards usan `!cancelled() && always()` para seguir informando fallos normales de shards, pero no se ponen en cola después de que todo el workflow ya haya sido reemplazado. La clave de concurrencia automática de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El dispatch manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Las ediciones del workflow de CI** validan el grafo de CI de Node más el linting de workflow, pero no fuerzan por sí solas builds nativas de Windows, Android o macOS; esos lanes de plataforma siguen limitados a cambios en el código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratos de core-test y ediciones estrechas de helpers/test-routing de contratos de Plugin** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, shards core completos, shards de bundled-plugin y matrices adicionales de guards cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** se limitan a wrappers de procesos/rutas específicos de Windows, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies de workflow de CI que ejecutan ese lane; los cambios no relacionados de código fuente, Plugin, install-smoke y solo pruebas permanecen en los lanes de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar runners en exceso: los contratos de canales se ejecutan como tres shards ponderados, los lanes core unit fast/support se ejecutan por separado, la infraestructura runtime core se divide entre shards de estado y proceso/config, auto-reply se ejecuta como workers equilibrados (con el subárbol reply dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic gateway/server se dividen en lanes de chat/auth/model/http-plugin/runtime/startup en lugar de esperar a los artefactos compilados. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards con patrones include registran entradas de tiempo usando el nombre de shard de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado. `check-additional` mantiene junto el trabajo de compilación/canary de package-boundary y separa la arquitectura de topología runtime de la cobertura de gateway watch; la lista de guards de boundary se distribuye en cuatro shards de matriz, cada uno ejecutando guards independientes seleccionados de forma concurrente e imprimiendo tiempos por comprobación, incluido `pnpm prompt:snapshots:check`, para que el drift de prompt de la ruta feliz runtime de Codex quede fijado al PR que lo causó. Gateway watch, las pruebas de canales y el shard core support-boundary se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK debug de Play. El sabor third-party no tiene un source set ni manifiesto separado; su lane de pruebas unitarias sigue compilando el sabor con las flags BuildConfig de SMS/call-log, mientras evita un trabajo duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo de dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de lanzamiento de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción sin usar de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos sin usar falla cuando un PR agrega un archivo nuevo sin revisar que no se usa o deja una entrada obsoleta en el allowlist, mientras preserva superficies intencionales dinámicas de Plugin, generadas, de build, live-test y puentes de paquete que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de ítem, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y solo debería publicar en `#clawsweeper` cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido duplicado de webhook y tráfico normal de revisiones deberían resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisiones, nombres de ramas y mensajes de commits de GitHub como datos no confiables en toda esta ruta. Son entrada para resumen y triage, no instrucciones para el workflow ni para el runtime del agente.

## Dispatches manuales

Los despachos manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todos los carriles con alcance no Android: shards de Linux Node, shards de plugins incluidos, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Python skills, Windows, macOS e i18n de Control UI. Los despachos manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas de versión completa habilita Android pasando `include_android=true`. Las comprobaciones estáticas de preversión de plugins, el shard exclusivo de versión `agentic-plugins`, el barrido completo por lotes de extensiones y los carriles Docker de preversión de plugins quedan excluidos de la CI. La suite Docker de preversión solo se ejecuta cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la compuerta de validación de versión habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de versión no sea cancelada por otra ejecución de push o PR en la misma referencia. La entrada opcional `target_ref` permite que un llamador de confianza ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de flujo de trabajo de la referencia de despacho seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/plugins incluidos, comprobaciones fragmentadas de contratos de canal, shards de `check` excepto lint, shards y agregados de `check-additional`, verificadores agregados de pruebas Node, comprobaciones de documentación, Python skills, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado en GitHub para que la matriz de Blacksmith pueda encolarse antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de pruebas Linux Node, shards de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costó más de lo que ahorró)                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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

El despacho manual normalmente mide la referencia del flujo de trabajo. Define `target_ref` para medir una etiqueta de versión u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probada, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el número de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres carriles:

- `mock-provider`: escenarios diagnósticos de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfiles de CPU/heap/traza para puntos críticos de arranque, Gateway y turno de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondeos de código fuente nativos de OpenClaw después del pase de Kova: tiempo de arranque y memoria del Gateway en casos de inicio predeterminado, con hook y con 50 plugins; bucles repetidos de saludo mock-OpenAI `channel-chat-baseline`; y comandos de inicio de CLI contra el Gateway arrancado. El resumen Markdown del sondeo de código fuente vive en `source/index.md` dentro del paquete del informe, con el JSON sin procesar junto a él.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondeo de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la referencia probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación de versión completa

`Full Release Validation` es el flujo de trabajo manual paraguas para "ejecutarlo todo antes de la versión". Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para pruebas exclusivas de versión de plugins/paquetes/estáticas/Docker, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas mantienen la cobertura exhaustiva live/E2E y de ruta de versión Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza esa cobertura soak para que la validación amplia de avisos siga siendo amplia. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de versión. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo carril de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación de versión completa](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de flujo de trabajo, las diferencias de perfil, los artefactos y
los manejadores de repetición enfocados.

`OpenClaw Release Publish` es el flujo de trabajo manual de versión que realiza cambios. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de versión y después de que
el preflight npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos los paquetes de plugins publicables, despacha
`Plugin ClawHub Release` para el mismo SHA de versión, y solo entonces despacha
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para una prueba de commit fijado en una rama que avanza rápido, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de despacho de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
helper empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
despacha `Full Release Validation` desde esa referencia fijada, verifica que cada `headSha` de flujo de trabajo hijo
coincida con el objetivo y elimina la rama temporal cuando la
ejecución se completa. El verificador paraguas también falla si cualquier flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud live/proveedor que se pasa a las comprobaciones de lanzamiento. Los
flujos de trabajo manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia consultiva de proveedores/medios. `run_release_soak`
controla si las comprobaciones de lanzamiento estables/predeterminadas ejecutan el soak exhaustivo live/E2E y
de ruta de lanzamiento de Docker; `full` fuerza el soak.

- `minimum` mantiene los carriles críticos de lanzamiento más rápidos de OpenAI/núcleo.
- `stable` agrega el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de ejecución hijos despachados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y agrega tablas de los trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y queda en verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado del paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prelanzamiento de Plugin, `release-checks` para cada hijo de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de lanzamiento fallida después de una corrección enfocada. Para un carril cross-OS fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los carriles QA de release-check son consultivos, así que los fallos solo de QA advierten, pero no bloquean el verificador de release-check.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto a las comprobaciones cross-OS y a Package Acceptance, además del flujo de trabajo Docker de ruta de lanzamiento live/E2E cuando se ejecuta la cobertura de soak. Eso mantiene los bytes del paquete consistentes entre las cajas de lanzamiento y evita volver a empaquetar el mismo candidato en varios trabajos hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen el paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que
ya haya despachado cuando se cancela el padre, así que la validación más nueva de main
no queda detrás de una ejecución obsoleta de dos horas de release-check. La validación de ramas/etiquetas
de lanzamiento y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El hijo live/E2E de lanzamiento mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en vez de un solo trabajo serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- trabajos `native-live-src-gateway-profiles` filtrados por proveedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragmentos separados de medios de audio/video y fragmentos de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos mientras hace que los fallos lentos de proveedores live sean más fáciles de repetir y diagnosticar. Los nombres de fragmento agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola vez.

Los fragmentos nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos en contenedores no son el lugar correcto para lanzar pruebas Docker anidadas.

Los fragmentos live de modelos/backends respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por confirmación seleccionada. El flujo de trabajo de lanzamiento live crea y publica esa imagen una vez, luego los fragmentos de modelo live de Docker, Gateway dividido por proveedores, backend CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del trabajo del flujo de trabajo, de modo que un contenedor atascado o una ruta de limpieza falle rápido en vez de consumir todo el presupuesto de release-check. Si esos fragmentos reconstruyen de forma independiente el objetivo Docker completo de código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Package Acceptance

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que Package Acceptance valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime la fuente, la referencia de flujo de trabajo, la referencia de paquete, la versión, el SHA-256 y el perfil en el resumen de pasos de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker de digest de paquete cuando hace falta y ejecuta los carriles Docker seleccionados contra ese paquete en vez de empaquetar la extracción del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos carriles como trabajos Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram todavía puede instalar una especificación publicada de npm.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación de Docker o el carril opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de prelanzamientos/estables publicados.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de confirmación de `package_ref` de confianza. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que la confirmación seleccionada sea alcanzable desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala dependencias en un worktree separado y la empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es la confirmación fuente que se empaqueta cuando `source=ref`. Esto permite que el arnés de prueba actual valide confirmaciones de fuente antiguas de confianza sin ejecutar lógica antigua de flujos de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos Docker de ruta de lanzamiento con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de Plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad live de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para despachos independientes.

Para la política dedicada de pruebas de actualización y Plugins, incluidos comandos locales,
carriles Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Pruebas de actualizaciones y Plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto preparado del paquete de lanzamiento, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquete, actualización, limpieza de dependencias obsoletas de Plugins, reparación de instalación de Plugins configurados, Plugin sin conexión, actualización de Plugin y prueba de Telegram sobre el mismo tarball de paquete resuelto. Configura `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm entregado en vez del artefacto creado desde el SHA. Las comprobaciones de lanzamiento cross-OS aún cubren onboarding, instalador y comportamiento de plataforma específicos del SO; la validación de producto de paquete/actualización debería empezar con Package Acceptance. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de lanzamiento bloqueante. En Package Acceptance, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de repetición de carriles fallidos preservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines=all-since-2026.4.23` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por cada lanzamiento npm estable desde `2026.4.23` hasta `latest` y fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de Plugins de OpenClaw, rutas de log con tilde y raíces obsoletas de dependencias de Plugins heredados. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es la limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de Full Release CI. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un único carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta incorporada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Los carriles frescos de paquetes e instaladores de Windows también verifican que un paquete instalado pueda importar una anulación de browser-control desde una ruta absoluta cruda de Windows. El smoke cross-OS agent-turn de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido, si no `openai/gpt-5.4`, de modo que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 mientras evita valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluidos `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar `update.channel` persistido faltante;
- los smokes de Plugin pueden leer ubicaciones heredadas de registros de instalación o aceptar persistencia faltante del registro de instalación del marketplace;
- `plugin-update` puede permitir migración de metadatos de configuración, sin dejar de exigir que el registro de instalación y el comportamiento de no reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se habían entregado. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en vez de advertir u omitirse.

### Ejemplos

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Al depurar una ejecución fallida de aceptación de paquete, empieza en el resumen `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución secundaria `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de lanes, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o las lanes Docker exactas en lugar de volver a ejecutar la validación completa de la versión.

## Smoke de instalación

El workflow separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies Docker/paquete, cambios en paquete/manifiesto de Plugin incluido, o superficies del Plugin SDK, Gateway, canal o Plugin del núcleo que ejercitan los jobs de smoke Docker. Los cambios de solo código fuente en Plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers Docker. La ruta rápida construye una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agents con espacio de trabajo compartido, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de Plugin incluido bajo un tiempo de espera agregado de comandos de 240 segundos (cada ejecución Docker de escenario se limita por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura Docker/de actualización del instalador para ejecuciones programadas nocturnas, dispatches manuales, comprobaciones de versión workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke GHCR del Dockerfile raíz para el SHA objetivo, luego ejecuta la instalación de paquete QR, smokes del Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E Docker rápido de Plugin incluido como jobs separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios pediría cobertura completa en un push, el workflow conserva el smoke Docker rápido y deja el smoke de instalación completo para la validación nocturna o de versión.

El smoke lento de proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de versión, y los dispatches manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles enfocados en instalación.

## E2E Docker local

`pnpm test:docker:all` preconstruye una imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor Node/Git básico para lanes de instalador/actualización/dependencias de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta las lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                   |
| -------------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Recuento de slots del pool principal para lanes normales.                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Recuento de slots del pool final sensible a proveedores.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de lanes live concurrentes para que los proveedores no apliquen throttling.           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de lanes concurrentes de instalación npm.                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de lanes multiservicio concurrentes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de lanes para evitar tormentas de creación del daemon Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Tiempo de espera de reserva por lane (120 minutos); lanes live/final seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del programador sin ejecutar lanes.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de lanes separadas por comas; omite el smoke de limpieza para que los agents puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede iniciar desde un pool vacío, y luego se ejecuta sola hasta liberar capacidad. Los preflights agregados locales comprueban Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten el estado de lanes activas, persisten los tiempos de lanes para ordenarlas de mayor a menor duración y, de forma predeterminada, dejan de programar nuevas lanes en pool después del primer fallo.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, lane y cobertura de credenciales se requieren. `scripts/docker-e2e.mjs` luego convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y sube imágenes Docker E2E GHCR básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita lanes con paquete instalado; y reutiliza las entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes con digest de paquete en lugar de reconstruir. Las descargas de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un flujo de registro/caché atascado reintente rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de versión

La cobertura Docker de versión ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute varias lanes mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de versión actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y de `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` permanecen como alias agregados de Plugin/runtime. El alias de lane `install-e2e` permanece como alias agregado de reejecución manual para ambas lanes de instalador de proveedor.

OpenWebUI se incorpora en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para dispatches exclusivos de OpenWebUI. Las lanes de actualización de canales incluidos reintentan una vez ante fallos transitorios de red npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de lanes, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de lanes lentas y comandos de reejecución por lane. La entrada `docker_lanes` del workflow ejecuta lanes seleccionadas contra las imágenes preparadas en lugar de los jobs de fragmentos, lo que mantiene la depuración de lanes fallidas acotada a un job Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una lane seleccionada es una lane Docker live, el job dirigido construye localmente la imagen de pruebas live para esa reejecución. Los comandos de reejecución de GitHub generados por lane incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando existen esos valores, para que una lane fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow live/E2E programado ejecuta a diario la suite Docker completa de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los dispatches manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensión; esos jobs de shards de extensión ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker Vitest por grupo y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no creen jobs de CI adicionales. La ruta de prelanzamiento Docker exclusiva de versión agrupa lanes Docker dirigidas en grupos pequeños para evitar reservar docenas de ejecutores para jobs de uno a tres minutos.

## QA Lab

QA Lab tiene lanes dedicadas de CI fuera del workflow principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y versión, no como un workflow independiente para PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba ir junto a una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y por dispatch manual; despliega la lane de paridad mock, la lane live de Matrix y las lanes live de Telegram y Discord como jobs paralelos. Los jobs live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de versión ejecutan lanes de transporte live de Matrix y Telegram con el proveedor mock determinista y modelos calificados para mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia del modelo live y del inicio normal del Plugin de proveedor. El Gateway de transporte live desactiva la búsqueda de memoria porque QA parity cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para gates programados y de versión, añadiendo `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow permanecen en `all`; el dispatch manual con `matrix_profile=all` siempre fragmenta la cobertura completa de Matrix en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las lanes de QA Lab críticas para versión antes de la aprobación de versión; su gate de paridad QA ejecuta los paquetes candidato y baseline como jobs de lane paralelos, luego descarga ambos artefactos en un job pequeño de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad inicial y limitado, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de guardia para solicitudes de incorporación de cambios que no son borradores escanean el código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La guardia de solicitudes de incorporación de cambios se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base del gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo más el runtime del plugin de canal, gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del núcleo, análisis de IP, guardia de red, web-fetch y política SSRF del Plugin SDK                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y compuertas de ejecución de herramientas del agente             |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y contrato de paquete del Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard de seguridad de Android programado. Compila manualmente la app de Android para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la cordura del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de seguridad de macOS semanal/manual. Compila manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el runner Linux más pequeño de Blacksmith. Su guardia de solicitudes de incorporación de cambios es intencionalmente más pequeña que el perfil programado: las PR que no son borradores solo ejecutan los shards correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, runtime de canales del núcleo y de plugins de canal incluidos, protocolo/métodos de servidor de gateway, runtime de memoria/glue de SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de plugins, Plugin SDK/contrato de paquete o runtime de respuestas del Plugin SDK. Los cambios de configuración de CodeQL y del flujo de trabajo de calidad ejecutan los doce shards de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, cron y gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del núcleo y plugins de canal incluidos                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelo/proveedor, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias de memoria del Plugin SDK, glue de activación del runtime de memoria y comandos doctor de memoria   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesión, helpers de enlace/entrega de sesión saliente, superficies de evento diagnóstico/paquete de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de enlace de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/búsqueda/fetch/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de la UI de control, persistencia local, flujos de control de gateway y contratos de runtime del plano de control de tareas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/búsqueda web del núcleo, IO de medios, comprensión de medios, generación de imágenes y generación de medios                          |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada del Plugin SDK                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente del Plugin SDK del lado del paquete publicado y helpers de contrato de paquete de plugin                                                                    |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a agregarse como trabajo de seguimiento acotado o en shards solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex basada en eventos para mantener la documentación existente alineada con los cambios aterrizados recientemente. No tiene una programación pura: una ejecución correcta de CI por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` avanzó o cuando otra ejecución no omitida de Docs Agent se creó en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, por lo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex basada en eventos para pruebas lentas. No tiene una programación pura: una ejecución correcta de CI por push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa compuerta de actividad diaria. La vía crea un informe de rendimiento de Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el conteo base de pruebas aprobadas. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe aprobar antes de que se confirme algo. Cuando `main` avanza antes de que aterrice el push del bot, la vía rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicadas después de fusionar

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenimiento para limpieza de duplicados posterior al aterrizaje. Por defecto es dry-run y solo cierra las PR listadas explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que la PR aterrizada esté fusionada y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de verificación local y enrutamiento de cambios

La lógica local de changed-lane vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta de verificación local es más estricta sobre los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y de pruebas del núcleo más lint/guardias del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo typecheck de pruebas del núcleo más lint del núcleo;
- los cambios de producción de extensión ejecutan typecheck de producción de extensión y de pruebas de extensión más lint de extensión;
- los cambios solo de pruebas de extensión ejecutan typecheck de pruebas de extensión más lint de extensión;
- los cambios públicos del Plugin SDK o del contrato de plugin se expanden a typecheck de extensión porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de release ejecutan verificaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de verificación.

El enrutamiento local de pruebas cambiadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible para grupos, el modo de entrega de respuesta de fuente o la ruta del prompt del sistema de la herramienta de mensajes pasan por las pruebas de respuestas del núcleo más regresiones de entrega de Discord y Slack, de modo que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto barato mapeado no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja recién calentada para pruebas amplias. Antes de gastar una puerta lenta en una caja que se reutilizó, expiró o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de sanidad falla rápido cuando desaparecieron archivos raíz requeridos, como `pnpm-lock.yaml`, o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remoto no es una copia confiable del PR; detén esa caja y calienta una nueva en lugar de depurar el fallo de prueba del producto. Para PRs con eliminaciones grandes intencionales, establece `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de sanidad.

`pnpm testbox:run` también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es el contenedor de cajas remotas propiedad del repositorio para pruebas de Linux de mantenedores. Úsalo cuando una comprobación sea demasiado amplia para un ciclo de edición local, cuando importe la paridad con CI, o cuando la prueba necesite secretos, Docker, carriles de paquetes, cajas reutilizables o registros remotos. El backend normal de OpenClaw es `blacksmith-testbox`; la capacidad propia de AWS/Hetzner es una alternativa para caídas de Blacksmith, problemas de cuota o pruebas explícitas con capacidad propia.

Antes de una primera ejecución, comprueba el contenedor desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El contenedor del repositorio rechaza un binario de Crabbox obsoleto que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia.

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
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Usa la reutilización solo cuando necesites intencionalmente varios comandos en la misma caja hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directamente como alternativa acotada:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario, o la capacidad propia sea explícitamente el objetivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para los carriles de nube propia. Excluye el `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/compilación que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso de entorno no secreto para los comandos `crabbox run --id <cbx_id>` de nube propia.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
