---
read_when:
    - Debes entender por qué se ejecutó o no un trabajo de CI
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-05T05:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva rutas costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan el grafo completo para candidatos de lanzamiento y validación amplia. Las rutas de Android siguen siendo optativas mediante `include_android`. La cobertura de plugins solo para lanzamientos vive en el flujo de trabajo separado [`Prelanzamiento de plugins`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o un despacho manual explícito.

## Descripción general de la canalización

| Trabajo                         | Propósito                                                                                                           | Cuándo se ejecuta                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                     | Detectar cambios solo de documentación, ámbitos cambiados, extensiones cambiadas y construir el manifiesto de la CI | Siempre en pushes y PRs no borrador       |
| `security-scm-fast`             | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`                                     | Siempre en pushes y PRs no borrador       |
| `security-dependency-audit`     | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                          | Siempre en pushes y PRs no borrador       |
| `security-fast`                 | Agregado requerido para los trabajos rápidos de seguridad                                                           | Siempre en pushes y PRs no borrador       |
| `check-dependencies`            | Pasada de Knip solo para dependencias de producción más la protección de la lista permitida de archivos sin usar    | Cambios relevantes para Node              |
| `build-artifacts`               | Construir `dist/`, Control UI, comprobaciones de artefactos construidos y artefactos descendentes reutilizables     | Cambios relevantes para Node              |
| `checks-fast-core`              | Rutas rápidas de corrección en Linux, como comprobaciones de plugins incluidos/contrato de plugins/protocolo        | Cambios relevantes para Node              |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado agregado estable de comprobación              | Cambios relevantes para Node              |
| `checks-node-core-test`         | Fragmentos de pruebas principales de Node, excluyendo rutas de canales, incluidos, contratos y extensiones          | Cambios relevantes para Node              |
| `check`                         | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, protecciones, tipos de prueba y smoke estricto | Cambios relevantes para Node              |
| `check-additional`              | Arquitectura, deriva fragmentada de límites/prompts, protecciones de extensiones, límite de paquete y gateway watch | Cambios relevantes para Node              |
| `build-smoke`                   | Pruebas smoke de la CLI construida y smoke de memoria de arranque                                                   | Cambios relevantes para Node              |
| `checks`                        | Verificador para pruebas de canales de artefactos construidos                                                       | Cambios relevantes para Node              |
| `checks-node-compat-node22`     | Ruta de build y smoke de compatibilidad con Node 22                                                                 | Despacho manual de CI para lanzamientos   |
| `check-docs`                    | Formato, lint y comprobaciones de enlaces rotos de la documentación                                                 | Documentación cambiada                    |
| `skills-python`                 | Ruff + pytest para Skills respaldadas por Python                                                                    | Cambios relevantes para Skills de Python  |
| `checks-windows`                | Pruebas específicas de Windows de procesos/rutas más regresiones compartidas de especificadores de importación en runtime | Cambios relevantes para Windows           |
| `macos-node`                    | Ruta de pruebas TypeScript en macOS usando los artefactos construidos compartidos                                   | Cambios relevantes para macOS             |
| `macos-swift`                   | Lint, build y pruebas de Swift para la app de macOS                                                                 | Cambios relevantes para macOS             |
| `android`                       | Pruebas unitarias de Android para ambos sabores más una build de APK de depuración                                  | Cambios relevantes para Android           |
| `test-performance-agent`        | Optimización diaria de pruebas lentas de Codex después de actividad confiable                                       | Éxito de CI principal o despacho manual   |
| `openclaw-performance`          | Informes diarios/bajo demanda de rendimiento del runtime de Kova con rutas de proveedor simulado, perfilado profundo y GPT 5.4 en vivo | Programado y despacho manual              |

## Orden de fallo rápido

1. `preflight` decide qué rutas existen siquiera. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con las rutas rápidas de Linux para que los consumidores descendentes puedan empezar tan pronto como la build compartida esté lista.
4. Las rutas más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o referencia `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para la misma referencia también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se encolen después de que todo el flujo de trabajo ya haya sido reemplazado. La clave de concurrencia automática de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de alcance cambiado y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Las ediciones de flujos de trabajo de CI** validan el grafo de CI de Node más el lint de flujos de trabajo, pero no fuerzan por sí mismas builds nativas de Windows, Android o macOS; esas rutas de plataforma permanecen limitadas a cambios de código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratos de pruebas core y ediciones estrechas de helpers/enrutamiento de pruebas de contrato de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, fragmentos core completos, fragmentos de plugins incluidos y matrices de protecciones adicionales cuando el cambio está limitado a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** están limitadas a wrappers específicos de procesos/rutas de Windows, helpers de ejecutores npm/pnpm/UI, configuración del gestor de paquetes y las superficies de flujos de trabajo de CI que ejecutan esa ruta; los cambios no relacionados en código fuente, plugins, smoke de instalación y solo de pruebas permanecen en las rutas de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo permanezca pequeño sin reservar runners en exceso: los contratos de canales se ejecutan como tres fragmentos ponderados, las rutas rápidas/de soporte de unidades core se ejecutan por separado, la infraestructura de runtime core se divide entre fragmentos de estado y proceso/configuración, la respuesta automática se ejecuta como workers equilibrados (con el subárbol de respuesta dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones de gateway/server agénticas se dividen entre rutas de chat/auth/model/http-plugin/runtime/startup en lugar de esperar artefactos construidos. Las pruebas amplias de navegador, QA, medios y plugins misceláneos usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos con patrones de inclusión registran entradas de tiempos usando el nombre del fragmento de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de límite de paquete y separa la arquitectura de topología de runtime de la cobertura de gateway watch; la lista de protecciones de límites se reparte en cuatro fragmentos de matriz, cada uno ejecuta protecciones independientes seleccionadas de forma concurrente e imprime tiempos por comprobación, incluido `pnpm prompt:snapshots:check`, para que la deriva de prompts del camino feliz del runtime de Codex quede fijada al PR que la causó. Gateway watch, las pruebas de canales y el fragmento de límite de soporte core se ejecutan concurrentemente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK de depuración de Play. El sabor de terceros no tiene un source set ni un manifiesto separados; su ruta de pruebas unitarias aun así compila el sabor con las banderas BuildConfig de SMS/registro de llamadas, mientras evita un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de lanzamiento de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción sin usar de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. La protección de archivos sin usar falla cuando un PR agrega un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la lista permitida, preservando a la vez superficies intencionales de plugins dinámicos, generadas, de build, pruebas en vivo y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código de pull request no confiable. El flujo de trabajo crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro rutas:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

La ruta `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando estén presentes. Intencionalmente evita reenviar el cuerpo completo del webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente de ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente de ClawSweeper recibe el destino de Discord en su prompt y solo debería publicar en `#clawsweeper` cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Las aperturas, ediciones, rotación de bots, ruido duplicado de webhook y tráfico normal de revisiones deberían dar como resultado `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisiones, nombres de ramas y mensajes de commits de GitHub como datos no confiables en todo este recorrido. Son entrada para resumen y triaje, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Despachos manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de cada lane con ámbito no Android: shards de Linux Node, shards de Plugin incluido, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de docs, Python skills, Windows, macOS e i18n de Control UI. Las ejecuciones manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas de release completo habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prelanzamiento de Plugin, el shard solo de release `agentic-plugins`, el barrido completo por lotes de extensiones y las lanes Docker de prelanzamiento de Plugin quedan excluidos de CI. La suite Docker de prelanzamiento se ejecuta solo cuando `Full Release Validation` dispara el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de release no sea cancelada por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite que un llamador de confianza ejecute ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de flujo de trabajo de la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canales, shards de `check` excepto lint, shards y agregados de `check-additional`, verificadores agregados de pruebas Node, comprobaciones de docs, Python skills, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu hospedado por GitHub para que la matriz Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de pruebas Linux Node, shards de pruebas de Plugin incluido, `android`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el coste del tiempo en cola de 32 vCPU costó más de lo que ahorró)                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento de producto/runtime. Se ejecuta a diario en `main` y puede dispararse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El dispatch manual normalmente mide la ref del flujo de trabajo. Define `target_ref` para medir una etiqueta de release u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la ref probada, y cada `index.md` registra la ref/SHA probado, la ref/SHA del flujo de trabajo, la ref de Kova, el perfil, el modo de autenticación de lane, el modelo, el recuento de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde una release fijada y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`, y luego ejecuta tres lanes:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: profiling de CPU/heap/trace para puntos críticos de arranque, Gateway y turnos de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

La lane mock-provider también ejecuta probes de código fuente nativas de OpenClaw después del pase de Kova: tiempos de arranque del Gateway y memoria en casos de arranque predeterminado, con hook y con 50 Plugins; bucles repetidos de hello `channel-chat-baseline` con mock-OpenAI; y comandos de arranque de CLI contra el Gateway iniciado. El resumen Markdown de probes de código fuente vive en `source/index.md` dentro del paquete de informe, con el JSON sin procesar junto a él.

Cada lane sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de probes de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la ref probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación Completa de Release

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes de la release". Acepta una rama, etiqueta o SHA de commit completo, dispara el flujo de trabajo manual `CI` con ese destino, dispara `Plugin Prerelease` para pruebas solo de release de Plugin/paquete/estáticas/Docker, y dispara `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y lanes de Telegram. Las ejecuciones estables/predeterminadas mantienen la cobertura exhaustiva live/E2E y de ruta de release Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza esa cobertura de soak para que la validación amplia de avisos siga siendo amplia. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de release checks. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar la misma lane de paquete de Telegram contra el paquete npm publicado.

Consulta [validación completa de release](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de flujo de trabajo, diferencias
de perfiles, artefactos y handles de rerun enfocados.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de release. Dispáralo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de release y después
de que el preflight de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
dispara `Plugin NPM Release` para todos los paquetes de Plugin publicables, dispara
`Plugin ClawHub Release` para el mismo SHA de release y solo entonces dispara
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para pruebas de commit fijado en una rama que avanza rápido, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de dispatch de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHAs
de commit sin procesar. El helper empuja una rama temporal `release-ci/<sha>-...` en el SHA
de destino, dispara `Full Release Validation` desde esa ref fijada, verifica que cada
`headSha` de flujo de trabajo hijo coincida con el destino y elimina la rama temporal cuando
la ejecución termina. El verificador paraguas también falla si algún flujo de trabajo hijo se
ejecutó en un SHA distinto.

`release_profile` controla la amplitud de live/proveedor que se pasa a las comprobaciones de release. Los workflows manuales de release usan `stable` de forma predeterminada; usa `full` solo cuando quieras intencionadamente la matriz amplia de proveedores/medios de advisory. `run_release_soak` controla si las comprobaciones de release estables/predeterminadas ejecutan el soak exhaustivo de live/E2E y de la ruta de release de Docker; `full` fuerza la activación del soak.

- `minimum` mantiene los lanes críticos de release de OpenAI/core más rápidos.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia de proveedores/medios de advisory.

El umbrella registra los ids de ejecución child despachados, y el job final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones child y añade tablas de los jobs más lentos para cada ejecución child. Si se vuelve a ejecutar un workflow child y pasa a verde, vuelve a ejecutar solo el job verificador parent para refrescar el resultado del umbrella y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de release, `ci` solo para el child de CI completa normal, `plugin-prerelease` solo para el child de prerelease de plugins, `release-checks` para cada child de release, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, o `npm-telegram` en el umbrella. Esto mantiene acotada la nueva ejecución de una caja de release fallida después de una corrección enfocada. Para un lane cross-OS fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas de heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los lanes QA de release-check son advisory, por lo que los fallos solo de QA advierten, pero no bloquean el verificador de release-check.

`OpenClaw Release Checks` usa la ref de workflow de confianza para resolver la ref seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto a las comprobaciones cross-OS y Package Acceptance, además del workflow Docker de live/E2E de ruta de release cuando se ejecuta la cobertura soak. Eso mantiene consistentes los bytes del paquete entre cajas de release y evita volver a empaquetar el mismo candidato en varios jobs child.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al umbrella más antiguo. El monitor parent cancela cualquier workflow child que
ya haya despachado cuando se cancela el parent, así que la validación más nueva de main
no queda detrás de una ejecución antigua de release-check de dos horas. La validación
de branch/tag de release y los grupos de nueva ejecución enfocados mantienen `cancel-in-progress: false`.

## Shards live y E2E

El child live/E2E de release mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un job serial:

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
- shards divididos de audio/video de medios y shards de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos y facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para nuevas ejecuciones manuales de una sola vez.

Los shards nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el workflow `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los jobs de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los jobs en contenedor no son el lugar adecuado para lanzar pruebas Docker anidadas.

Los shards de modelo/backend live respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El workflow de release live construye y publica esa imagen una vez, y luego los shards Docker de modelo live, Gateway segmentado por proveedor, backend de CLI, ACP bind y harness de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del job de workflow, para que un contenedor atascado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de release-check. Si esos shards reconstruyen independientemente el target Docker completo del código fuente, la ejecución de release está mal configurada y desperdiciará tiempo de reloj en builds de imagen duplicados.

## Package Acceptance

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que Package Acceptance valida un único tarball mediante el mismo harness Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime la fuente, la ref de workflow, la ref de paquete, la versión, el SHA-256 y el perfil en el resumen de pasos de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El workflow reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker de digest de paquete cuando hace falta y ejecuta los lanes Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del workflow. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el workflow reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos lanes como jobs Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un dispatch independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` falla el workflow si falló la resolución del paquete, la aceptación Docker o el lane opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para aceptación de prerelease/estable publicado.
- `source=ref` empaqueta una branch, tag o SHA de commit completo `package_ref` de confianza. El resolver obtiene branches/tags de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de branches del repositorio o un tag de release, instala dependencias en un worktree desacoplado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería suministrarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de workflow/harness de confianza que ejecuta la prueba. `package_ref` es el commit fuente que se empaqueta cuando `source=ref`. Esto permite que el harness de pruebas actual valide commits fuente antiguos de confianza sin ejecutar lógica de workflow antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks completos de ruta de release Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins offline para que la validación de paquetes publicados no dependa de la disponibilidad live de ClawHub. El lane opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para dispatches independientes.

Para la política dedicada de pruebas de actualizaciones y plugins, incluidos comandos locales,
lanes Docker, entradas de Package Acceptance, valores predeterminados de release y triaje de fallos,
consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de release llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, actualización, limpieza de dependencias obsoletas de plugins, reparación de instalación de plugins configurados, prueba de plugins offline, actualización de plugins y prueba de Telegram sobre el mismo tarball de paquete resuelto. Configura `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm publicado en lugar del artefacto construido por SHA. Las comprobaciones de release cross-OS siguen cubriendo comportamiento específico de sistema operativo para onboarding, instalador y plataforma; la validación de producto de paquete/actualización debería empezar con Package Acceptance. El lane Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de release bloqueante. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de fallback, con valor predeterminado `openclaw@latest`; los comandos de nueva ejecución de lanes fallidos preservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por las cuatro últimas releases estables de npm más releases fijadas de frontera de compatibilidad de plugins y fixtures con forma de incidencias para la configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de log con tilde y roots obsoletos de dependencias de plugins legacy. Las selecciones multi-línea base de published-upgrade survivor se dividen por línea base en jobs separados de runner Docker dirigido. El workflow separado `Update Migration` usa el lane Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es la limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de Full Release CI. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un solo lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El lane publicado configura la línea base con una receta horneada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y prueba `/healthz`, `/readyz`, además del estado RPC después del inicio del Gateway. Los lanes frescos empaquetados e instaladores de Windows también verifican que un paquete instalado pueda importar una sustitución de browser-control desde una ruta absoluta raw de Windows. El smoke de agent-turn cross-OS de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está configurado; de lo contrario, `openai/gpt-5.4`, de modo que la prueba de instalación y Gateway permanece en un modelo de prueba GPT-5 y evita valores predeterminados GPT-4.x.

### Ventanas de compatibilidad legacy

Package Acceptance tiene ventanas acotadas de compatibilidad legacy para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas QA privadas conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa flag;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar `update.channel` persistido faltante;
- los smokes de plugins pueden leer ubicaciones legacy de install-record o aceptar la falta de persistencia de install-record de marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración y seguir exigiendo que el install record y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir sobre archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquete, comienza por el resumen `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Luego inspecciona la ejecución secundaria `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de carriles, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los carriles de Docker exactos en lugar de volver a ejecutar la validación completa de lanzamiento.

## Smoke de instalación

El workflow separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquete, cambios en paquetes/manifiestos de Plugin incluidos, o superficies principales de Plugin/canal/Gateway/SDK de Plugin que ejercitan los jobs de smoke de Docker. Los cambios de solo código fuente en Plugin incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila la imagen del Dockerfile raíz una vez, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agents en workspace compartido, ejecuta el e2e de red de Gateway en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil de Docker de Plugin incluido acotado con un tiempo de espera agregado de comando de 240 segundos (cada ejecución de Docker del escenario se limita por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura de Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke de Dockerfile raíz de GHCR para el SHA objetivo, luego ejecuta la instalación de paquete QR, smokes de Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E rápido de Docker de Plugin incluido como jobs separados para que el trabajo del instalador no espere detrás de los smokes de imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene el smoke rápido de Docker y deja el smoke completo de instalación para la ejecución nocturna o la validación de lanzamiento.

El smoke lento de proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas de Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para carriles de instalador/actualización/dependencia de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Conteo de slots del grupo principal para carriles normales.                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Conteo de slots del grupo final sensible a proveedores.                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de carriles en vivo concurrentes para que los proveedores no apliquen throttling.      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de carriles concurrentes de instalación npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de carriles multi-servicio concurrentes.                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de carriles para evitar tormentas de creación del demonio Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Tiempo de espera alternativo por carril (120 minutos); los carriles en vivo/finales seleccionados usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset          | `1` imprime el plan del programador sin ejecutar carriles.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset          | Lista separada por comas de carriles exactos; omite el smoke de limpieza para que los agents puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede comenzar desde un grupo vacío, luego se ejecuta solo hasta liberar capacidad. Los preflights agregados locales comprueban Docker, eliminan contenedores E2E de OpenClaw obsoletos, emiten el estado de carriles activos, persisten tiempos de carriles para ordenamiento de más largo primero y dejan de programar nuevos carriles agrupados después del primer fallo de forma predeterminada.

### Workflow reutilizable en vivo/E2E

El workflow reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y envía imágenes E2E de Docker básicas/funcionales de GHCR etiquetadas con digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Los pulls de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un stream de registro/caché atascado reintente rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento solo descargue el tipo de imagen que necesita y ejecute varios carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de reejecución manual para ambos carriles de instalador de proveedor.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carriles, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de carriles lentos y comandos de reejecución por carril. La entrada `docker_lanes` del workflow ejecuta carriles seleccionados contra las imágenes preparadas en lugar de los jobs de fragmentos, lo que mantiene la depuración de carriles fallidos acotada a un job de Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker en vivo, el job dirigido compila localmente la imagen de prueba en vivo para esa reejecución. Los comandos de reejecución de GitHub generados por carril incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparada cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow programado en vivo/E2E ejecuta diariamente la suite completa de Docker de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugin incluidos entre ocho workers de extensión; esos jobs de fragmentos de extensión ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugin con muchas importaciones no creen jobs adicionales de CI. La ruta Docker de prelanzamiento solo para lanzamiento agrupa carriles Docker dirigidos en grupos pequeños para evitar reservar decenas de runners para jobs de uno a tres minutos.

## Laboratorio de QA

QA Lab tiene carriles de CI dedicados fuera del workflow principal con alcance inteligente. La paridad agéntica está anidada bajo los harnesses amplios de QA y lanzamiento, no en un workflow de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución de validación amplia.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en despacho manual; distribuye el carril de paridad mock, el carril de Matrix en vivo y los carriles en vivo de Telegram y Discord como jobs paralelos. Los jobs en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia de modelos en vivo y del arranque normal de Plugin de proveedor. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para gates programados y de lanzamiento, y agrega `--fail-fast` solo cuando la CLI del checkout lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en los jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos para lanzamiento de QA Lab antes de la aprobación de lanzamiento; su gate de paridad de QA ejecuta los paquetes candidato y baseline como jobs de carril paralelos, luego descarga ambos artefactos en un job de informe pequeño para la comparación final de paridad.

Para PR normales, sigue la evidencia de CI/comprobación con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionadamente un escáner de seguridad inicial y estrecho, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de pull requests no draft escanean código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secretos, sandbox, cron y línea base de gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación del canal del core más el runtime de Plugin de canal, gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del core, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                           |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agentes                |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, loader, manifest, registry, instalación de package-manager, carga de fuentes y contrato de paquete de Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard programado de seguridad de Android. Compila la app de Android manualmente para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la cordura del workflow. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de seguridad de macOS. Compila la app de macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard correspondiente no relacionado con seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript no relacionadas con seguridad y de severidad de error sobre superficies estrechas de alto valor en el runner Blacksmith Linux más pequeño. Su protección de pull requests es intencionadamente menor que el perfil programado: los PR no draft solo ejecutan los shards correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de auth/secretos/sandbox/seguridad, runtime del canal del core y del Plugin de canal incluido, protocolo/método de servidor del gateway, runtime de memoria/glue de SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, loader de Plugin, Plugin SDK/contrato de paquete, o runtime de respuestas de Plugin SDK. Los cambios de configuración de CodeQL y del workflow de calidad ejecutan los doce shards de calidad de PR.

El dispatch manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límites de seguridad de auth, secretos, sandbox, cron y gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal del core y del Plugin de canal incluido                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuestas automáticas, y contratos de runtime del plano de control ACP                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias de Plugin SDK de memoria, glue de activación de runtime de memoria y comandos doctor de memoria     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesiones salientes, superficies de bundle de eventos/logs diagnósticos y contratos CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes de Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, auth y descubrimiento de proveedores, registro de runtime de proveedor, valores predeterminados/catálogos de proveedores y registries de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de UI de control, persistencia local, flujos de control de gateway y contratos de runtime del plano de control de tareas                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de web fetch/search del core, IO de medios, comprensión de medios, generación de imágenes y generación de medios                             |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registry, superficie pública y entrypoint de Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente de Plugin SDK del lado del paquete publicado y helpers de contrato de paquete de Plugin                                                                    |

La calidad permanece separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La ampliación de CodeQL para Swift, Python y Plugins incluidos debe volver a añadirse como trabajo de seguimiento con alcance o en shards solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es un carril de mantenimiento de Codex orientado por eventos para mantener los docs existentes alineados con cambios incorporados recientemente. No tiene un programa puro: una ejecución de CI exitosa de push no bot en `main` puede activarlo, y el dispatch manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA fuente anterior no omitido de Docs Agent hasta el `main` actual, por lo que una ejecución por hora puede cubrir todos los cambios de main acumulados desde la última pasada de docs.

### Test Performance Agent

El workflow `Test Performance Agent` es un carril de mantenimiento de Codex orientado por eventos para tests lentos. No tiene un programa puro: una ejecución de CI exitosa de push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o está en ejecución ese día UTC. El dispatch manual omite esa puerta de actividad diaria. El carril genera un informe completo de rendimiento de Vitest agrupado de la suite, permite que Codex haga solo pequeñas correcciones de rendimiento de tests que preserven cobertura en lugar de refactors amplios, luego vuelve a ejecutar el informe completo de la suite y rechaza cambios que reduzcan el recuento base de tests aprobados. Si la línea base tiene tests fallidos, Codex puede corregir solo fallos obvios y el informe completo de la suite posterior al agente debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que aterrice el push del bot, el carril rebasea el patch validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los patches obsoletos con conflictos se omiten. Usa Ubuntu hospedado por GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de docs.

### PR duplicados después de merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedores para limpieza de duplicados posterior al aterrizaje. Su valor predeterminado es dry-run y solo cierra PR enumerados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté merged y que cada duplicado tenga una issue referenciada compartida o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación locales y enrutamiento de cambios

La lógica local de changed-lane vive en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta sobre límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del core ejecutan typecheck de prod del core y tests del core más lint/guards del core;
- los cambios solo de tests del core ejecutan solo typecheck de tests del core más lint del core;
- los cambios de producción de extensión ejecutan typecheck de prod y tests de extensión más lint de extensión;
- los cambios solo de tests de extensión ejecutan typecheck de tests de extensión más lint de extensión;
- los cambios públicos de Plugin SDK o de contrato de Plugin se expanden a typecheck de extensiones porque las extensiones dependen de esos contratos del core (los barridos Vitest de extensiones siguen siendo trabajo de tests explícito);
- los aumentos de versión solo de metadata de release ejecutan comprobaciones dirigidas de versión/config/dependencias raíz;
- los cambios desconocidos de raíz/config fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de changed-test vive en `scripts/test-projects.test-support.mjs` y es intencionadamente más barato que `check:changed`: las ediciones directas de tests se ejecutan a sí mismas, las ediciones de fuente prefieren mapeos explícitos, luego tests hermanos y dependientes del grafo de importación. La configuración compartida de entrega de group-room es uno de los mapeos explícitos: los cambios a la configuración de respuesta visible de grupo, el modo de entrega de respuesta de origen o el prompt del sistema de la herramienta de mensajes se enrutan por los tests de respuesta del core más regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy fiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja nueva precalentada para pruebas amplias. Antes de gastar un gate lento en una caja reutilizada, caducada o que acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de sanidad falla rápido cuando desaparecen archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remota no es una copia confiable del PR; detén esa caja y precalienta una nueva en lugar de depurar el fallo de la prueba del producto. Para PRs con eliminaciones grandes intencionales, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de sanidad.

`pnpm testbox:run` también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es el wrapper de cajas remotas propiedad del repositorio para pruebas Linux de mantenedores. Úsalo cuando una comprobación sea demasiado amplia para un bucle local de edición, cuando importe la paridad con CI, o cuando la prueba necesite secretos, Docker, carriles de paquetes, cajas reutilizables o logs remotos. El backend normal de OpenClaw es `blacksmith-testbox`; la capacidad propia de AWS/Hetzner es un recurso alternativo para caídas de Blacksmith, problemas de cuota o pruebas explícitas con capacidad propia.

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

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Las ejecuciones únicas de Crabbox respaldadas por Blacksmith deberían detener Testbox automáticamente; si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo las cajas que creaste:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Usa la reutilización solo cuando necesites intencionalmente varios comandos en la misma caja hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directo como recurso alternativo acotado:

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

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para carriles de nube propia. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos remotos de Git en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/build que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso de entorno no secreto para comandos `crabbox run --id <cbx_id>` de nube propia.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
