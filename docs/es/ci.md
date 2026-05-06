---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-06T09:02:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta en cada push a `main` y en cada pull request. El job `preflight` clasifica el diff y desactiva lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y expanden todo el grafo para candidatos de lanzamiento y validación amplia. Las lanes de Android siguen siendo opcionales mediante `include_android`. La cobertura de Plugin exclusiva de lanzamiento vive en el workflow separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o desde un despacho manual explícito.

## Resumen del pipeline

| Job                              | Propósito                                                                                                   | Cuándo se ejecuta                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecta cambios solo de docs, alcances cambiados, extensiones cambiadas y genera el manifiesto de CI                   | Siempre en pushes y PRs que no sean borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflow mediante `zizmor`                                                     | Siempre en pushes y PRs que no sean borrador |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                          | Siempre en pushes y PRs que no sean borrador |
| `security-fast`                  | Agregado requerido para los jobs rápidos de seguridad                                                             | Siempre en pushes y PRs que no sean borrador |
| `check-dependencies`             | Pasada de Knip solo de dependencias de producción más el guard de allowlist de archivos sin usar                                 | Cambios relevantes para Node              |
| `build-artifacts`                | Genera `dist/`, Control UI, comprobaciones de artefactos generados y artefactos reutilizables posteriores                       | Cambios relevantes para Node              |
| `checks-fast-core`               | Lanes rápidas de corrección en Linux, como comprobaciones de bundled/plugin-contract/protocol                              | Cambios relevantes para Node              |
| `checks-fast-contracts-channels` | Comprobaciones de contratos de canales fragmentadas con un resultado agregado estable                                      | Cambios relevantes para Node              |
| `checks-node-core-test`          | Shards de pruebas core de Node, excluyendo lanes de canales, bundled, contratos y extensiones                          | Cambios relevantes para Node              |
| `check`                          | Equivalente fragmentado del gate local principal: tipos de producción, lint, guards, tipos de prueba y smoke estricto                | Cambios relevantes para Node              |
| `check-additional`               | Arquitectura, drift fragmentado de límites/prompts, guards de extensiones, límite de paquete y gateway watch        | Cambios relevantes para Node              |
| `build-smoke`                    | Pruebas smoke de la CLI generada y smoke de memoria de inicio                                                            | Cambios relevantes para Node              |
| `checks`                         | Verificador para pruebas de canales con artefactos generados                                                                 | Cambios relevantes para Node              |
| `checks-node-compat-node22`      | Lane de build y smoke de compatibilidad con Node 22                                                                | Despacho manual de CI para lanzamientos    |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos en docs                                                             | Docs cambiadas                       |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                                                    | Cambios relevantes para Skills de Python      |
| `checks-windows`                 | Pruebas específicas de procesos/rutas en Windows más regresiones compartidas de especificadores de importación en runtime                      | Cambios relevantes para Windows           |
| `macos-node`                     | Lane de pruebas TypeScript en macOS usando los artefactos generados compartidos                                               | Cambios relevantes para macOS             |
| `macos-swift`                    | Lint, build y pruebas de Swift para la app de macOS                                                            | Cambios relevantes para macOS             |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una build de APK debug                                              | Cambios relevantes para Android           |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex tras actividad confiable                                                 | Éxito de CI en main o despacho manual |
| `openclaw-performance`           | Informes diarios/bajo demanda de rendimiento del runtime Kova con lanes de mock-provider, deep-profile y GPT 5.4 live | Programado y despacho manual      |

## Orden de fail-fast

1. `preflight` decide qué lanes existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los jobs más pesados de artefactos y matrices de plataforma.
3. `build-artifacts` se solapa con las lanes rápidas de Linux para que los consumidores posteriores puedan empezar en cuanto la build compartida esté lista.
4. Las lanes más pesadas de plataforma y runtime se expanden después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando un push más nuevo llega al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Las comprobaciones agregadas de shards usan `!cancelled() && always()` para seguir informando fallos normales de shards, pero no encolarse después de que todo el workflow ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Las ediciones del workflow de CI** validan el grafo de CI de Node más el linting de workflow, pero por sí solas no fuerzan builds nativas de Windows, Android o macOS; esas lanes de plataforma permanecen limitadas a cambios en código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas baratas de fixtures de pruebas core y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de Plugin** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, shards core completos, shards de bundled-plugin y matrices de guards adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones Node de Windows** están limitadas a wrappers específicos de procesos/rutas de Windows, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies del workflow de CI que ejecutan esa lane; los cambios no relacionados de código fuente, Plugin, install-smoke y solo de pruebas permanecen en las lanes Node de Linux.

Las familias de pruebas Node más lentas se dividen o equilibran para que cada job se mantenga pequeño sin reservar runners en exceso: los contratos de canales se ejecutan como tres shards ponderados, las lanes rápidas/de soporte de unidades core se ejecutan por separado, la infraestructura core de runtime se divide entre shards de estado y de proceso/configuración, auto-reply se ejecuta como workers equilibrados (con el subárbol de reply dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/server se dividen entre lanes de chat/auth/model/http-plugin/runtime/startup en lugar de esperar artefactos generados. Las pruebas amplias de navegador, QA, medios y Plugins misceláneos usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de Plugins. Los shards con patrones de inclusión registran entradas de tiempos usando el nombre del shard de CI, por lo que `.artifacts/vitest-shard-timings.json` puede distinguir una configuración completa de un shard filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de límite de paquete y separa la arquitectura de topología de runtime de la cobertura de gateway watch; la lista de guards de límites se reparte en cuatro shards de matriz, cada uno ejecuta guards independientes seleccionados en paralelo e imprime tiempos por comprobación, incluido `pnpm prompt:snapshots:check`, de modo que el drift de prompts del happy path de runtime de Codex quede fijado al PR que lo causó. Gateway watch, las pruebas de canales y el shard de límite de soporte core se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya se hayan generado.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego genera el APK debug de Play. El sabor third-party no tiene source set ni manifiesto separados; su lane de pruebas unitarias aún compila el sabor con las flags BuildConfig de SMS/call-log, mientras evita un job duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo de dependencias de producción fijada a la última versión de Knip, con la edad mínima de lanzamiento de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción sin usar de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos sin usar falla cuando un PR agrega un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la allowlist, preservando a la vez superficies intencionales de Plugin dinámico, generadas, de build, live-test y de puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

La lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número del elemento, URL, título, estado y extractos breves de comentarios o reviews cuando están presentes. Intencionalmente evita reenviar el cuerpo completo del Webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operativamente útil. Las aperturas rutinarias, ediciones, actividad repetitiva de bots, ruido duplicado de Webhook y tráfico normal de reviews deberían dar como resultado `NO_REPLY`.

Trata títulos, comentarios, cuerpos, texto de reviews, nombres de ramas y mensajes de commits de GitHub como datos no confiables en toda esta ruta. Son entradas para resumen y triage, no instrucciones para el workflow ni para el runtime del agente.

## Despachos manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan todos los carriles con alcance no Android: fragmentos de Linux Node, fragmentos de Plugin incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de la UI de Control. Las ejecuciones manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas completo de lanzamiento habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prelanzamiento de Plugin, el fragmento `agentic-plugins` solo de lanzamiento, el barrido completo por lotes de extensiones y los carriles Docker de prelanzamiento de Plugin se excluyen de CI. La suite Docker de prelanzamiento se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de lanzamiento habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidata de lanzamiento no sea cancelada por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite que un llamador de confianza ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de flujo de trabajo de la ref de despacho seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canales, fragmentos de `check` excepto lint, agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado en GitHub para que la matriz de Blacksmith pueda encolarse antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Linux Node, fragmentos de pruebas de Plugin incluidos, fragmentos de `check-additional`, `android`                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costó más de lo que ahorró)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta a diario en `main` y se puede despachar manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente mide el rendimiento de la ref del flujo de trabajo. Define `target_ref` para medir una etiqueta de lanzamiento u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la ref probada, y cada `index.md` registra la ref/SHA probada, la ref/SHA del flujo de trabajo, la ref de Kova, el perfil, el modo de autenticación del carril, el modelo, el recuento de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde un lanzamiento fijado y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/traza para puntos calientes de inicio, Gateway y turnos de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después del pase de Kova: tiempos de arranque del Gateway y memoria en casos de inicio predeterminado, con hook y con 50 Plugin; bucles repetidos de saludo `channel-chat-baseline` con mock-OpenAI; y comandos de inicio de CLI contra el Gateway arrancado. El resumen Markdown de la sonda de código fuente vive en `source/index.md` dentro del paquete de informe, con JSON sin procesar junto a él.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondas de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la ref probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de lanzamiento

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes del lanzamiento". Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para prueba solo de lanzamiento de Plugin/paquete/estática/Docker, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas mantienen la cobertura exhaustiva live/E2E y de ruta de lanzamiento Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza esa cobertura de soak para que la validación amplia de avisos siga siendo amplia. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo carril de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la
matriz de etapas, nombres exactos de trabajos del flujo de trabajo, diferencias de perfiles, artefactos y
manejadores de reejecución enfocados.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de lanzamiento. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de lanzamiento y después de que el
preflight npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos los paquetes de Plugin publicables, despacha
`Plugin ClawHub Release` para el mismo SHA de lanzamiento, y solo entonces despacha
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para prueba de commit fijado en una rama que avanza rápido, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de despacho de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA sin procesar de commit. El
helper empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
despacha `Full Release Validation` desde esa ref fijada, verifica que cada `headSha` de flujo de trabajo
hijo coincida con el objetivo, y elimina la rama temporal cuando la ejecución
termina. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud de live/provider que se pasa a las comprobaciones de release. Los
workflows manuales de release usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia de proveedores/medios de asesoramiento. `run_release_soak`
controla si las comprobaciones de release stable/predeterminadas ejecutan el soak exhaustivo live/E2E y
de ruta de release de Docker; `full` fuerza la activación del soak.

- `minimum` conserva los lanes críticos de release de OpenAI/núcleo más rápidos.
- `stable` agrega el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia de proveedores/medios de asesoramiento.

El workflow paraguas registra los ids de las ejecuciones hijas despachadas, y el job final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de los jobs más lentos para cada ejecución hija. Si se vuelve a ejecutar un workflow hijo y pasa a verde, vuelve a ejecutar solo el job verificador padre para actualizar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de release, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prerelease de plugins, `release-checks` para cada hijo de release, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de release fallida después de una corrección enfocada. Para un lane cross-OS fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los lanes de comprobación de release de QA son de asesoramiento, por lo que los fallos solo de QA avisan pero no bloquean el verificador de release-check.

`OpenClaw Release Checks` usa la ref de workflow confiable para resolver la ref seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto a las comprobaciones cross-OS y Package Acceptance, además del workflow Docker live/E2E de ruta de release cuando se ejecuta cobertura soak. Eso mantiene los bytes del paquete consistentes entre cajas de release y evita volver a empaquetar el mismo candidato en varios jobs hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan el paraguas anterior. El monitor padre cancela cualquier workflow hijo que
ya haya despachado cuando se cancela el padre, por lo que la validación más nueva de main
no queda detrás de una ejecución obsoleta de release-check de dos horas. La validación de ramas/tags de release
y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de release conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un único job serial:

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

Eso mantiene la misma cobertura de archivos y hace que los fallos lentos de proveedores live sean más fáciles de repetir y diagnosticar. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola vez.

Los shards nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el workflow `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los jobs de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los jobs de contenedor no son el lugar adecuado para lanzar pruebas Docker anidadas.

Los shards live de modelo/backend respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El workflow live de release construye y publica esa imagen una vez; luego los shards Docker live de modelo, Gateway dividido por proveedor, backend CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites de `timeout` explícitos a nivel de script por debajo del timeout del job del workflow, para que un contenedor o ruta de limpieza atascados fallen rápido en lugar de consumir todo el presupuesto de release-check. Si esos shards reconstruyen de forma independiente el target Docker completo del código fuente, la ejecución de release está mal configurada y desperdiciará tiempo de pared en builds de imagen duplicados.

## Package Acceptance

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que package acceptance valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime la fuente, ref del workflow, ref del paquete, versión, SHA-256 y perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El workflow reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest del paquete cuando hace falta y ejecuta los lanes Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del workflow. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el workflow reutilizable prepara el paquete y las imágenes compartidas una vez, y luego reparte esos lanes como jobs Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el despacho independiente de Telegram aún puede instalar una especificación npm publicada.
4. `summary` hace fallar el workflow si falló la resolución del paquete, la aceptación Docker o el lane opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para aceptación de prerelease/stable publicados.
- `source=ref` empaqueta una rama, tag o SHA de commit completo confiable de `package_ref`. El resolvedor obtiene ramas/tags de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o un tag de release, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` de `artifact_run_id` y `artifact_name`; `package_sha256` es opcional pero debería suministrarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código confiable de workflow/arnés que ejecuta la prueba. `package_ref` es el commit fuente que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits fuente confiables más antiguos sin ejecutar lógica de workflow antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks completos de ruta de release Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación del paquete publicado no dependa de la disponibilidad live de ClawHub. El lane opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para despachos independientes.

Para la política dedicada de pruebas de actualizaciones y plugins, incluidos comandos locales,
lanes Docker, entradas de Package Acceptance, valores predeterminados de release y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de release llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, actualización, limpieza de dependencias de plugins obsoletas, reparación de instalación de plugins configurados, plugin sin conexión, actualización de plugin y prueba de Telegram sobre el mismo tarball de paquete resuelto. Define `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm publicado en lugar del artefacto construido desde SHA. Las comprobaciones de release cross-OS todavía cubren el onboarding, instalador y comportamiento de plataforma específicos del SO; la validación de producto de paquete/actualización debería empezar con Package Acceptance. El lane Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de release bloqueante. En Package Acceptance, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de fallback, predeterminada a `openclaw@latest`; los comandos de repetición de lanes fallidos preservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse entre los cuatro releases npm stable más recientes, además de releases fijados de límite de compatibilidad de plugins y fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de log con tilde y raíces de dependencias de plugins heredadas obsoletas. Las selecciones published-upgrade survivor con varias líneas base se dividen por línea base en jobs Docker runner dirigidos separados. El workflow separado `Update Migration` usa el lane Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de Full Release CI. Las ejecuciones agregadas locales pueden pasar especificaciones de paquete exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un único lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El lane publicado configura la línea base con una receta incorporada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y prueba `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Los lanes frescos empaquetados e instalador de Windows también verifican que un paquete instalado pueda importar un override de control de navegador desde una ruta absoluta raw de Windows. El smoke de turno de agente cross-OS de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.4`, de modo que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluidos `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia de `gateway install --wrapper` cuando el paquete no expone esa flag;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` ausentes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de plugins pueden leer ubicaciones heredadas de install-record o aceptar la falta de persistencia de install-record del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración sin dejar de exigir que el install record y el comportamiento de no reinstalación permanezcan sin cambios.

El paquete `2026.4.26` publicado también puede advertir sobre archivos de sello de metadatos de compilación locales que ya se habían enviado. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Después inspecciona la ejecución secundaria de `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de carriles, tiempos de fase y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los carriles de Docker exactos en lugar de volver a ejecutar la validación de lanzamiento completa.

## Smoke de instalación

El flujo de trabajo independiente `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios en paquetes/manifiestos de plugins incluidos, o superficies del núcleo de plugins/canales/gateway/Plugin SDK que ejercitan los jobs smoke de Docker. Los cambios de código fuente solo en plugins incluidos, ediciones solo de pruebas y ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila la imagen del Dockerfile raíz una vez, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes con espacio de trabajo compartido, ejecuta el e2e de red de gateway en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil de Docker acotado de plugins incluidos bajo un timeout agregado de comandos de 240 segundos (cada ejecución de Docker del escenario se limita por separado).
- **Ruta completa** mantiene la cobertura de instalación de paquetes QR y Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento mediante workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke de Dockerfile raíz GHCR de SHA objetivo, y luego ejecuta la instalación de paquetes QR, smokes de Dockerfile raíz/gateway, smokes de instalador/actualización y el E2E rápido de Docker de plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el flujo de trabajo mantiene el smoke rápido de Docker y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento de proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas de Docker QR y de instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para carriles de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta los carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Cantidad de slots del pool principal para carriles normales.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Cantidad de slots del pool final sensible a proveedores.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Límite de carriles en vivo concurrentes para que los proveedores no apliquen throttling.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Límite de carriles de instalación npm concurrentes.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Límite de carriles multiservicio concurrentes.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Escalonamiento entre inicios de carriles para evitar tormentas de creación del daemon de Docker; establece `0` para no escalonar.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout de respaldo por carril (120 minutos); los carriles en vivo/final seleccionados usan límites más estrictos.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime el plan del programador sin ejecutar carriles.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista de carriles exactos separados por comas; omite el smoke de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede iniciar desde un pool vacío, y luego se ejecuta solo hasta liberar capacidad. Los preflights agregados locales comprueban Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten estado de carriles activos, persisten tiempos de carriles para ordenación de más largo a más corto y, de forma predeterminada, dejan de programar nuevos carriles agrupados tras el primer fallo.

### Flujo de trabajo en vivo/E2E reutilizable

El flujo de trabajo en vivo/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes E2E de Docker GHCR básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas de Docker de Blacksmith cuando el plan necesita carriles con paquetes instalados; y reutiliza las entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las descargas de imágenes de Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo de registry/caché bloqueado reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de la ruta de lanzamiento

La cobertura de Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute múltiples carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos actuales de Docker de lanzamiento son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugins/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de reejecución manual para ambos carriles de instaladores de proveedores.

OpenWebUI se incorpora en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y mantiene un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del plan del programador, tablas de carriles lentos y comandos de reejecución por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta carriles seleccionados contra las imágenes preparadas en lugar de los jobs de fragmentos, lo que mantiene la depuración de carriles fallidos acotada a un job de Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril de Docker en vivo, el job dirigido compila localmente la imagen de prueba en vivo para esa reejecución. Los comandos generados de reejecución por carril de GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando existen esos valores, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El flujo de trabajo programado en vivo/E2E ejecuta diariamente la suite completa de Docker de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Balancea las pruebas de plugins incluidos en ocho workers de extensión; esos jobs fragmentados de extensión ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen jobs de CI adicionales. La ruta de prelanzamiento de Docker solo de lanzamiento agrupa carriles de Docker dirigidos en grupos pequeños para evitar reservar docenas de runners para jobs de uno a tres minutos.

## Laboratorio de QA

El laboratorio de QA tiene carriles dedicados de CI fuera del flujo de trabajo principal de alcance inteligente. La paridad agéntica está anidada bajo los harnesses amplios de QA y lanzamiento, no como un flujo de trabajo de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba ir junto con una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante despacho manual; distribuye en paralelo el carril de paridad mock, el carril en vivo de Matrix y los carriles en vivo de Telegram y Discord como jobs paralelos. Los jobs en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia de modelos en vivo y del inicio normal de plugins de proveedores. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores se cubre mediante las suites independientes de modelos en vivo, proveedores nativos y proveedores en Docker.

Matrix usa `--profile fast` para gates programados y de lanzamiento, y añade `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; el despacho manual `matrix_profile=all` siempre fragmenta la cobertura completa de Matrix en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento del laboratorio de QA antes de la aprobación del lanzamiento; su gate de paridad de QA ejecuta los paquetes candidato y baseline como jobs de carril paralelos, y luego descarga ambos artefactos en un pequeño job de informe para la comparación final de paridad.

Para PR normales, sigue la evidencia de CI/comprobaciones con ámbito en lugar de tratar la paridad como un estado obligatorio.

## CodeQL

El workflow `CodeQL` es intencionadamente un escáner de seguridad estrecho de primera pasada, no un barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de pull requests que no son borrador escanean el código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. Android y macOS CodeQL quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secretos, sandbox, cron y base del Gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del core más el runtime de plugins de canal, Gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del core, análisis de IP, guardia de red, web-fetch y política SSRF del Plugin SDK                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente                  |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, loader, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y contrato de paquete del Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard programado de seguridad de Android. Compila manualmente la app de Android para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la cordura del workflow. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de seguridad de macOS. Compila manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard correspondiente no relacionado con seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript no relacionadas con seguridad y de severidad error sobre superficies estrechas de alto valor en el runner Blacksmith Linux más pequeño. Su protección de pull requests es intencionadamente menor que el perfil programado: los PR que no son borrador solo ejecutan los shards correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de auth/secretos/sandbox/seguridad, runtime de canales del core y plugins de canal incluidos, protocolo del Gateway/métodos de servidor, runtime de memoria/glue del SDK, MCP/procesos/entrega saliente, runtime de proveedores/catálogo de modelos, diagnósticos de sesión/colas de entrega, loader de plugins, Plugin SDK/contrato de paquete o runtime de respuestas del Plugin SDK. Los cambios de configuración de CodeQL y de workflow de calidad ejecutan los doce shards de calidad de PR.

El dispatch manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secretos, sandbox, cron y código de límite de seguridad del Gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo del Gateway y contratos de métodos de servidor                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del core y plugins de canal incluidos                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias de memoria del Plugin SDK, glue de activación de runtime de memoria y comandos doctor de memoria    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de la cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, payload/chunking/helpers de runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, auth y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de Control UI, persistencia local, flujos de control del Gateway y contratos de runtime del plano de control de tareas                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web del core, IO de medios, comprensión de medios, generación de imágenes y generación de medios                             |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registro, superficie pública y puntos de entrada del Plugin SDK                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente del Plugin SDK del lado del paquete publicado y helpers de contrato de paquetes de plugin                                                                  |

La calidad permanece separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento con ámbito o en shards solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es una vía de mantenimiento de Codex impulsada por eventos para mantener la documentación existente alineada con los cambios que aterrizaron recientemente. No tiene una programación pura: una ejecución exitosa de CI por push que no sea de bot en `main` puede activarlo, y el dispatch manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA fuente del Docs Agent no omitido anterior hasta el `main` actual, por lo que una ejecución por hora puede cubrir todos los cambios en main acumulados desde la última pasada de documentación.

### Test Performance Agent

El workflow `Test Performance Agent` es una vía de mantenimiento de Codex impulsada por eventos para pruebas lentas. No tiene una programación pura: una ejecución exitosa de CI por push que no sea de bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o está ejecutándose ese día UTC. El dispatch manual omite esa puerta de actividad diaria. La vía crea un informe de rendimiento de Vitest agrupado de la suite completa, permite a Codex hacer solo pequeñas correcciones de rendimiento de pruebas que preserven cobertura en lugar de refactors amplios, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el conteo base de pruebas aprobadas. Si la base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que aterrice el push del bot, la vía hace rebase del parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PR duplicados después de merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedores para limpieza de duplicados posterior al aterrizaje. Por defecto usa dry-run y solo cierra los PR enumerados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga una incidencia referenciada compartida o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación local y enrutamiento de cambios

La lógica local de changed-lane vive en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta sobre límites de arquitectura que el ámbito amplio de la plataforma de CI:

- los cambios de producción del core ejecutan typecheck de producción y de pruebas del core más lint/guardias del core;
- los cambios solo de pruebas del core ejecutan solo typecheck de pruebas del core más lint del core;
- los cambios de producción de extensión ejecutan typecheck de producción y de pruebas de extensión más lint de extensión;
- los cambios solo de pruebas de extensión ejecutan typecheck de pruebas de extensión más lint de extensión;
- los cambios públicos del Plugin SDK o del contrato de plugin se expanden a typecheck de extensión porque las extensiones dependen de esos contratos del core (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de release ejecutan comprobaciones específicas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de comprobación.

El enrutamiento local de changed-test vive en `scripts/test-projects.test-support.mjs` y es intencionadamente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de fuente prefieren asignaciones explícitas, luego pruebas hermanas y dependientes del grafo de imports. La configuración de entrega compartida de salas de grupo es una de las asignaciones explícitas: los cambios a la configuración de respuesta visible en grupo, el modo de entrega de respuesta de fuente o el prompt de sistema de message-tool pasan por las pruebas de respuesta del core más regresiones de entrega de Discord y Slack para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy fiable.

## Validación en Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una instancia nueva preparada para una prueba amplia. Antes de invertir una puerta lenta en una instancia que se reutilizó, expiró o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la instancia.

La comprobación de integridad falla rápido cuando desaparecen archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remoto no es una copia confiable del PR; detén esa instancia y prepara una nueva en lugar de depurar el fallo de prueba del producto. Para PRs con eliminaciones masivas intencionales, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de integridad.

`pnpm testbox:run` también termina una invocación local de Blacksmith CLI que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diferencias locales inusualmente grandes.

Crabbox es el wrapper de instancias remotas propio del repositorio para pruebas de Linux de mantenedores. Úsalo cuando una comprobación sea demasiado amplia para un ciclo local de edición, cuando importe la paridad con CI, o cuando la prueba necesite secretos, Docker, carriles de paquetes, instancias reutilizables o registros remotos. El backend normal de OpenClaw es `blacksmith-testbox`; la capacidad propia de AWS/Hetzner es una alternativa para caídas de Blacksmith, problemas de cuota o pruebas explícitas con capacidad propia.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario de Crabbox obsoleto que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia.

Gate de cambios:

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

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Las ejecuciones únicas de Crabbox respaldadas por Blacksmith deberían detener Testbox automáticamente; si se interrumpe una ejecución o la limpieza no está clara, inspecciona las instancias activas y detén solo las instancias que creaste:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Usa reutilización solo cuando necesites intencionalmente varios comandos en la misma instancia hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directamente como alternativa limitada:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escala a la capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para carriles de nube propia. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos remotos de Git en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/compilación que nunca deberían transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la entrega del entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
