---
read_when:
    - Necesita comprender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o repetición de la validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-02T22:17:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva las rutas costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan todo el grafo para candidatos de lanzamiento y validación amplia. Las rutas de Android siguen siendo opt-in mediante `include_android`. La cobertura de plugins solo de lanzamiento vive en el flujo de trabajo separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o desde un despacho manual explícito.

## Descripción general del pipeline

| Trabajo                         | Propósito                                                                                                           | Cuándo se ejecuta                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar cambios solo de documentación, alcances modificados, extensiones modificadas y compilar el manifiesto de CI | Siempre en pushes y PRs no draft  |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`                                     | Siempre en pushes y PRs no draft  |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                          | Siempre en pushes y PRs no draft  |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                                           | Siempre en pushes y PRs no draft  |
| `check-dependencies`             | Pasada de Knip solo para dependencias de producción más la protección de la lista de permitidos de archivos sin usar | Cambios relevantes para Node      |
| `build-artifacts`                | Compilar `dist/`, Control UI, comprobaciones de artefactos compilados y artefactos reutilizables posteriores        | Cambios relevantes para Node      |
| `checks-fast-core`               | Rutas rápidas de corrección en Linux, como comprobaciones de plugins incluidos, contrato de plugins y protocolo      | Cambios relevantes para Node      |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado agregado estable                               | Cambios relevantes para Node      |
| `checks-node-core-test`          | Fragmentos de pruebas de Node del núcleo, excluyendo rutas de canales, incluidos, contratos y extensiones           | Cambios relevantes para Node      |
| `check`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, protecciones, tipos de prueba y smoke estricto | Cambios relevantes para Node      |
| `check-additional`               | Arquitectura, límites, deriva de snapshots de prompts, protecciones de superficie de extensiones, límites de paquete y fragmentos de gateway-watch | Cambios relevantes para Node      |
| `build-smoke`                    | Pruebas smoke de CLI compilada y smoke de memoria de arranque                                                       | Cambios relevantes para Node      |
| `checks`                         | Verificador para pruebas de canales con artefactos compilados                                                       | Cambios relevantes para Node      |
| `checks-node-compat-node22`      | Ruta de compilación y smoke de compatibilidad con Node 22                                                           | Despacho manual de CI para lanzamientos |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos de la documentación                                                 | Documentación modificada          |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                                                    | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Pruebas específicas de Windows de procesos/rutas más regresiones compartidas de especificadores de importación en runtime | Cambios relevantes para Windows   |
| `macos-node`                     | Ruta de pruebas TypeScript en macOS usando los artefactos compilados compartidos                                    | Cambios relevantes para macOS     |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                                           | Cambios relevantes para macOS     |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una compilación de APK debug                                    | Cambios relevantes para Android   |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex tras actividad confiable                                             | Éxito de CI principal o despacho manual |
| `openclaw-performance`           | Informes diarios/bajo demanda de rendimiento del runtime de Kova con rutas de proveedor mock, perfil profundo y GPT 5.4 en vivo | Programado y despacho manual      |

## Orden fail-fast

1. `preflight` decide qué rutas existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matrices de plataforma.
3. `build-artifacts` se solapa con las rutas rápidas de Linux para que los consumidores posteriores puedan empezar tan pronto como la compilación compartida esté lista.
4. Las rutas más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más reciente al mismo PR o ref de `main`. Trata eso como ruido de CI salvo que la ejecución más nueva para el mismo ref también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se encolen después de que todo el flujo de trabajo ya haya sido reemplazado. La clave de concurrencia automática de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Las ediciones del flujo de trabajo de CI** validan el grafo de CI de Node más el lint de flujos de trabajo, pero no fuerzan por sí solas compilaciones nativas de Windows, Android o macOS; esas rutas de plataforma siguen limitadas a cambios en código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas del núcleo, y ediciones estrechas de helpers de contrato de plugins/enrutamiento de pruebas** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canales, fragmentos completos del núcleo, fragmentos de plugins incluidos y matrices de protecciones adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** se limitan a wrappers específicos de Windows de procesos/rutas, helpers de ejecutores npm/pnpm/UI, configuración de gestores de paquetes y las superficies de flujos de trabajo de CI que ejecutan esa ruta; los cambios no relacionados de código fuente, plugins, install-smoke y solo de pruebas permanecen en las rutas de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin sobrerreservar runners: los contratos de canales se ejecutan como tres fragmentos ponderados, las rutas unitarias pequeñas del núcleo se emparejan, auto-reply se ejecuta como cuatro workers equilibrados (con el subárbol de reply dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/plugins se reparten entre los trabajos agentic de Node existentes solo de código fuente en lugar de esperar a artefactos compilados. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos con patrones de inclusión registran entradas de tiempo usando el nombre del fragmento de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene junto el trabajo de compilación/canary de límites de paquetes y separa la arquitectura de topología de runtime de la cobertura de gateway watch; el fragmento de protección de límites ejecuta sus pequeñas protecciones independientes de forma concurrente dentro de un trabajo, incluyendo `pnpm prompt:snapshots:check` para que la deriva de prompts del happy path de Codex quede fijada al PR que la causó. Gateway watch, las pruebas de canales y el fragmento de límites de soporte del núcleo se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK debug de Play. El sabor de terceros no tiene un source set ni manifiesto separado; su ruta de pruebas unitarias todavía compila el sabor con las banderas BuildConfig de SMS/call-log, evitando a la vez un trabajo duplicado de empaquetado de APK debug en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de lanzamiento de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción sin usar de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. La protección de archivos sin usar falla cuando un PR agrega un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la lista de permitidos, al tiempo que preserva superficies intencionales de plugins dinámicos, generadas, de compilación, de pruebas en vivo y de puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El flujo de trabajo crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro rutas:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

La ruta `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente de ClawSweeper.

La actividad general es observación, no entrega de forma predeterminada. El agente de ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, arriesgado u operacionalmente útil. Aperturas rutinarias, ediciones, actividad repetitiva de bots, ruido duplicado de webhooks y tráfico normal de revisiones deberían dar como resultado `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commits de GitHub como datos no confiables en toda esta ruta. Son entrada para resumen y triage, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Despachos manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todos los carriles con alcance no Android: fragmentos de Linux Node, fragmentos de plugins incluidos, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de Control UI. Las ejecuciones manuales de CI independientes ejecutan solo Android con `include_android=true`; el paraguas de lanzamiento completo habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prelanzamiento de plugins, el fragmento `agentic-plugins` exclusivo de lanzamiento, el barrido completo por lotes de extensiones y los carriles Docker de prelanzamiento de plugins quedan excluidos de la CI. La suite Docker de prelanzamiento solo se ejecuta cuando `Full Release Validation` lanza el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de lanzamiento habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único, de modo que una suite completa candidata a lanzamiento no sea cancelada por otra ejecución de push o PR en la misma referencia. La entrada opcional `target_ref` permite que un invocador de confianza ejecute ese grafo contra una rama, etiqueta o SHA de confirmación completo mientras usa el archivo de flujo de trabajo de la referencia de lanzamiento seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, trabajos y agregados rápidos de seguridad (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/plugins incluidos, comprobaciones fragmentadas de contratos de canal, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, cordura de flujos de trabajo, etiquetador, respuesta automática; el preflight de install-smoke también usa Ubuntu hospedado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas Linux Node, fragmentos de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; las bifurcaciones usan `macos-latest` como alternativa                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; las bifurcaciones usan `macos-latest` como alternativa                                                                                                                                                                                                                                                                                                                                                                             |

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto y del entorno de ejecución. Se ejecuta a diario en `main` y puede lanzarse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

El flujo de trabajo instala OCM desde una versión fijada y Kova desde la entrada fijada `kova_ref`, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un entorno de ejecución de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU, heap y trazas para puntos críticos de inicio, Gateway y turnos de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondeos de código fuente nativos de OpenClaw después de la pasada de Kova: tiempos de arranque y memoria del Gateway en casos de inicio predeterminado, con gancho y con 50 plugins; bucles de saludo repetidos de OpenAI simulado `channel-chat-baseline`; y comandos de inicio de CLI contra el Gateway arrancado. El resumen Markdown de sondeos de código fuente vive en `source/index.md` dentro del paquete de informe, con el JSON sin procesar al lado.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondeos de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. El puntero de la rama actual se escribe como `openclaw-performance/<ref>/latest-<lane>.json`.

## Validación completa de lanzamiento

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes del lanzamiento". Acepta una rama, etiqueta o SHA de confirmación completo, lanza el flujo de trabajo manual `CI` con ese destino, lanza `Plugin Prerelease` para pruebas de plugin/paquete/estáticas/Docker exclusivas de lanzamiento y lanza `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, suites de ruta de lanzamiento Docker, en vivo/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo carril de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de flujo de trabajo, las diferencias de perfiles, los artefactos y los
identificadores de reejecución enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual de lanzamiento que modifica estado. Lánzalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de lanzamiento y después de que la
comprobación previa de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
lanza `Plugin NPM Release` para todos los paquetes de plugins publicables, lanza
`Plugin ClawHub Release` para el mismo SHA de lanzamiento y solo entonces lanza
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para pruebas de confirmación fijada en una rama que cambia rápidamente, usa el ayudante en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias para lanzar flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de confirmación sin procesar. El
ayudante empuja una rama temporal `release-ci/<sha>-...` en el SHA de destino,
lanza `Full Release Validation` desde esa referencia fijada, verifica que cada
`headSha` de flujo de trabajo hijo coincida con el destino y elimina la rama temporal cuando la
ejecución se completa. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla el alcance en vivo/de proveedores pasado a las comprobaciones de lanzamiento. Los
flujos de trabajo manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia de proveedores/medios de carácter consultivo.

- `minimum` conserva los carriles críticos para el lanzamiento de OpenAI/núcleo más rápidos.
- `stable` añade el conjunto estable de proveedores/backend.
- `full` ejecuta la matriz amplia de proveedores/medios de carácter consultivo.

El paraguas registra los IDs de ejecución hijos lanzados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y agrega tablas de trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado paraguas y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para una versión candidata, `ci` solo para el hijo normal de CI completa, `plugin-prerelease` solo para el hijo de prerelease del plugin, `release-checks` para cada hijo de lanzamiento, o un grupo más acotado: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la nueva ejecución de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al flujo de trabajo Docker de ruta de lanzamiento live/E2E como al shard de aceptación de paquete. Eso mantiene los bytes del paquete coherentes entre cajas de lanzamiento y evita volver a empaquetar el mismo candidato en varios trabajos hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que
ya haya despachado cuando se cancela el padre, de modo que la validación más reciente de main
no queda detrás de una ejecución obsoleta de release-check de dos horas. La validación de ramas/etiquetas
de lanzamiento y los grupos de nueva ejecución enfocados mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de lanzamiento mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un solo trabajo serial:

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
- shards separados de audio/video multimedia y shards de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos y a la vez facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para nuevas ejecuciones manuales de una sola vez.

Los shards nativos live de multimedia se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de multimedia solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos en contenedor son el lugar equivocado para lanzar pruebas Docker anidadas.

Los shards live de modelo/backend respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por confirmación seleccionada. El flujo de trabajo live de lanzamiento construye y publica esa imagen una vez; luego los shards live Docker de modelo, Gateway segmentado por proveedor, backend de CLI, enlace ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites `timeout` explícitos a nivel de script por debajo del timeout del trabajo del flujo de trabajo, para que un contenedor atascado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de release-check. Si esos shards reconstruyen independientemente el destino Docker completo de la fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo real en compilaciones de imagen duplicadas.

## Aceptación de paquete

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es distinto de la CI normal: la CI normal valida el árbol fuente, mientras que la aceptación de paquete valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la referencia del flujo de trabajo, la referencia del paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest de paquete cuando sea necesario y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego despliega esos carriles como trabajos Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram todavía puede instalar una especificación publicada de npm.
4. `summary` falla el flujo de trabajo si falló la resolución de paquete, la aceptación Docker o el carril opcional de Telegram.

### Orígenes de candidato

- `source=npm` acepta solo `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de prereleases/estables publicados.
- `source=ref` empaqueta una rama, etiqueta o SHA de confirmación completo de `package_ref` de confianza. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que la confirmación seleccionada sea alcanzable desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala dependencias en un worktree desacoplado y la empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` de `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es la confirmación fuente que se empaqueta cuando `source=ref`. Esto permite que el arnés de prueba actual valide confirmaciones fuente de confianza más antiguas sin ejecutar lógica antigua de flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks completos de ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins offline, para que la validación de paquetes publicados no dependa de la disponibilidad live de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se conserva para despachos independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
carriles Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triage de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` y `telegram_mode=mock-openai`. Esto mantiene la prueba de migración de paquete, actualización, limpieza de dependencias obsoletas de plugins, reparación de instalación de plugins configurados, plugins offline, actualización de plugins y Telegram sobre el mismo tarball de paquete resuelto. Configura `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm publicado en lugar del artefacto construido desde SHA. Las comprobaciones de lanzamiento cross-OS siguen cubriendo el onboarding específico del sistema operativo, el instalador y el comportamiento de plataforma; la validación de producto de paquete/actualización debería empezar con Package Acceptance. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de nueva ejecución de carriles fallidos preservan esa línea base. Configura `published_upgrade_survivor_baselines=all-since-2026.4.23` para expandir la CI de Full Release a cada lanzamiento estable de npm desde `2026.4.23` hasta `latest`; `release-history` sigue disponible para muestreos manuales más amplios con el ancla anterior a esa fecha. Configura `published_upgrade_survivor_scenarios=reported-issues` para expandir las mismas líneas base a fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de logs con tilde y raíces de dependencias de plugins heredadas obsoletas. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es la limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de la CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un solo carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o configurar `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz` y el estado RPC después de iniciar Gateway. Los carriles frescos empaquetados y de instalador de Windows también verifican que un paquete instalado pueda importar una anulación de browser-control desde una ruta absoluta cruda de Windows. El smoke cross-OS de turno de agente de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está configurado; de lo contrario, `openai/gpt-5.4`, para que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración y aun así exigir que el registro de instalación y el comportamiento de no reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se habían enviado. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución secundaria de `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de lanes, tiempos de fases y comandos de reejecución. Prefiere reejecutar el perfil de paquete fallido o las lanes exactas de Docker en lugar de reejecutar la validación completa de la versión.

## Smoke de instalación

El workflow independiente `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para solicitudes de incorporación de cambios que tocan superficies de Docker/paquete, cambios de paquete/manifiesto de Plugin incluido, o superficies principales de Plugin/canal/Gateway/SDK de Plugin que ejercitan los jobs smoke de Docker. Los cambios solo de código fuente en Plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida construye una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agents en workspace compartido, ejecuta el e2e de gateway-network en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil acotado de Docker de Plugin incluido bajo un timeout agregado de comando de 240 segundos (cada ejecución de Docker de cada escenario se limita por separado).
- **Ruta completa** conserva la instalación de paquetes QR y la cobertura de Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de versión mediante workflow-call y solicitudes de incorporación de cambios que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke de GHCR para el Dockerfile raíz de un SHA objetivo, y luego ejecuta la instalación de paquetes QR, smokes del Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E rápido de Docker de Plugin incluido como jobs separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de fusión) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene el smoke rápido de Docker y deja el smoke completo de instalación para la validación nocturna o de versión.

El smoke lento de proveedor de imágenes de instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de versión, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero las solicitudes de incorporación de cambios y los pushes a `main` no. Las pruebas de Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` preconstruye una imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para lanes de instalador/actualización/dependencias de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta las lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                   | Recuento de ranuras del grupo principal para lanes normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                   | Recuento de ranuras del grupo final sensible a proveedores.                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                    | Límite de lanes live concurrentes para que los proveedores no apliquen limitación.            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                   | Límite de lanes concurrentes de instalación npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                    | Límite de lanes concurrentes multiservicio.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000                 | Escalonamiento entre inicios de lanes para evitar ráfagas de creación del daemon de Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000              | Timeout de respaldo por lane (120 minutos); las lanes live/finales seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir          | `1` imprime el plan del programador sin ejecutar lanes.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir          | Lista exacta de lanes separada por comas; omite el smoke de limpieza para que los agents puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede iniciarse desde un grupo vacío, y luego se ejecuta sola hasta liberar capacidad. El agregado local ejecuta preflights de Docker, elimina contenedores E2E de OpenClaw obsoletos, emite estado de lanes activas, persiste tiempos de lanes para ordenar de mayor a menor duración y deja de programar nuevas lanes agrupadas después del primer fallo de forma predeterminada.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué cobertura de paquete, tipo de imagen, imagen live, lane y credenciales se requiere. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y publica imágenes E2E de Docker GHCR básicas/funcionales etiquetadas con digest de paquete mediante la caché de capas de Docker de Blacksmith cuando el plan necesita lanes con paquete instalado; y reutiliza las entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de reconstruir. Los pulls de imágenes de Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo atascado de registry/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de la ruta de versión

La cobertura de Docker de versión ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1`, para que cada fragmento extraiga solo el tipo de imagen que necesita y ejecute varias lanes mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos actuales de Docker de versión son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y de `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de lane `install-e2e` sigue siendo el alias agregado de reejecución manual para ambas lanes de instalador de proveedor.

OpenWebUI se incorpora a `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las lanes de actualización de canales incluidos reintentan una vez ante fallos transitorios de red npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de lanes, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de lanes lentas y comandos de reejecución por lane. La entrada `docker_lanes` del workflow ejecuta lanes seleccionadas contra las imágenes preparadas en lugar de los jobs de fragmentos, lo que mantiene la depuración de lanes fallidas acotada a un job de Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una lane seleccionada es una lane live de Docker, el job dirigido construye la imagen de pruebas live localmente para esa reejecución. Los comandos de reejecución de GitHub generados por lane incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, para que una lane fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow live/E2E programado ejecuta a diario la suite completa de Docker de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow independiente despachado por `Full Release Validation` o por un operador explícito. Las solicitudes de incorporación de cambios normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensión; esos jobs de shards de extensión ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker de Vitest por grupo y un heap de Node mayor para que los lotes de Plugins con muchas importaciones no creen jobs adicionales de CI. La ruta de prelanzamiento de Docker solo para versiones agrupa lanes de Docker dirigidas en grupos pequeños para evitar reservar docenas de runners para jobs de uno a tres minutos.

## Laboratorio de QA

El laboratorio de QA tiene lanes de CI dedicadas fuera del workflow principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y versión, no como un workflow independiente para PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y con despacho manual; despliega la lane de paridad mock, la lane live de Matrix y las lanes live de Telegram y Discord como jobs paralelos. Los jobs live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de versión ejecutan lanes de transporte live de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia del modelo live y del inicio normal del Plugin de proveedor. El Gateway de transporte live desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedor está cubierta por las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para gates programadas y de versión, añadiendo `--fail-fast` solo cuando la CLI obtenida lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; un despacho manual con `matrix_profile=all` siempre divide la cobertura completa de Matrix en los jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las lanes críticas de QA Lab antes de aprobar la versión; su gate de paridad de QA ejecuta los paquetes candidato y de referencia como jobs de lanes paralelos, y luego descarga ambos artefactos en un job de informe pequeño para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El flujo de trabajo `CodeQL` es intencionadamente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones de protección diarias, manuales y de pull requests no borrador analizan el código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo se inicia para cambios en `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. Android y macOS CodeQL quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Línea base de autenticación, secretos, sandbox, cron y gateway                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo más el runtime de Plugin de canal, gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del núcleo, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y compuertas de ejecución de herramientas de agentes          |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, loader, manifest, registry, instalación con package-manager, carga de fuentes y contrato de paquetes de Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard de seguridad Android programado. Compila la app Android manualmente para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la comprobación de coherencia del flujo de trabajo. Carga en `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de seguridad macOS semanal/manual. Compila la app macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF cargado y carga en `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard correspondiente no relacionado con seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el runner Linux de Blacksmith más pequeño. Su protección de pull requests es intencionadamente más pequeña que el perfil programado: los PR no borrador solo ejecutan los shards correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, esquema/migración/IO de configuración, autenticación/secretos/sandbox/seguridad, canal del núcleo y runtime de Plugin de canal incluido, protocolo/método de servidor de gateway, unión de runtime de memoria/SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, loader de Plugin, Plugin SDK/contrato de paquete o runtime de respuestas de Plugin SDK. Los cambios de configuración de CodeQL y del flujo de trabajo de calidad ejecutan los doce shards de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, cron y gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canal del núcleo y Plugin de canal incluido                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelo/proveedor, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, facades del runtime de memoria, alias de Plugin SDK de memoria, unión de activación del runtime de memoria y comandos doctor de memoria   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de colas de respuesta, colas de entrega de sesión, helpers de vinculación/entrega de sesión saliente, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes de Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registries de web/búsqueda/fetch/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de la UI de control, persistencia local, flujos de control de gateway y contratos de runtime del plano de control de tareas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/búsqueda web del núcleo, IO de medios, comprensión de medios, generación de imágenes y generación de medios                          |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de loader, registry, superficie pública y punto de entrada de Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente de Plugin SDK del lado del paquete publicado y helpers de contrato de paquete de plugin                                                                     |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo posterior acotado o dividido en shards solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Docs Agent

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex basado en eventos para mantener la documentación existente alineada con cambios incorporados recientemente. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones de workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución de Docs Agent no omitida en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior de Docs Agent no omitido hasta el `main` actual, de modo que una ejecución por hora puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Test Performance Agent

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex basado en eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, pero se omite si otra invocación workflow-run ya se ejecutó o está en ejecución ese día UTC. El despacho manual evita esa compuerta de actividad diaria. El carril crea un informe de rendimiento Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactors amplios, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. Si la línea base tiene pruebas fallidas, Codex solo puede corregir fallos obvios y el informe de suite completa posterior al agente debe aprobar antes de que se haga cualquier commit. Cuando `main` avanza antes de que aterrice el push del bot, el carril hace rebase del parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado por GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PR duplicados después del merge

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de maintainers para limpieza de duplicados después de aterrizar cambios. De forma predeterminada usa dry-run y solo cierra los PR enumerados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga una issue referenciada compartida o hunks modificados solapados.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de comprobación locales y enrutamiento de cambios

La lógica local de changed-lane vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta de comprobación local es más estricta con los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y pruebas del núcleo más lint/guards del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo typecheck de pruebas del núcleo más lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción de extensiones y pruebas de extensiones más lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones más lint de extensiones;
- los cambios públicos de Plugin SDK o contrato de plugin se expanden al typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los bumps de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas cambiadas vive en `scripts/test-projects.test-support.mjs` y es intencionadamente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible de grupo, el modo de entrega de respuestas de origen o el prompt del sistema de message-tool pasan por las pruebas de respuesta del núcleo más regresiones de entrega de Discord y Slack para que un cambio compartido predeterminado falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio es lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere un entorno recién preparado para una validación amplia. Antes de gastar una comprobación lenta en un entorno reutilizado, caducado o que acaba de informar de una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro del entorno.

La comprobación de cordura falla rápido cuando desaparecen archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones con seguimiento. Eso normalmente significa que el estado de sincronización remoto no es una copia confiable del PR; detén ese entorno y prepara uno nuevo en lugar de depurar el fallo de prueba del producto. Para PRs con muchas eliminaciones intencionadas, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de Blacksmith CLI que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es la segunda ruta de entornos remotos propiedad del repositorio para validación en Linux cuando Blacksmith no está disponible o cuando es preferible usar capacidad en la nube propia. Prepara un entorno, hidrátalo mediante el flujo de trabajo del proyecto y luego ejecuta comandos con la CLI de Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos de Git remoto en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de tiempo de ejecución y compilación que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso de entorno no secreto que los comandos posteriores de `crabbox run --id <cbx_id>` cargan como fuente.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
