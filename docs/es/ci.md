---
read_when:
    - Necesita comprender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Está depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Está cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, agrupaciones de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-02T20:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva las vías costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y expanden todo el grafo para candidatos de lanzamiento y validación amplia. Las vías de Android siguen siendo opcionales mediante `include_android`. La cobertura de Plugin solo para lanzamientos vive en el flujo de trabajo separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o desde una ejecución manual explícita.

## Resumen del pipeline

| Trabajo                         | Propósito                                                                                                              | Cuándo se ejecuta                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Detecta cambios solo en documentación, ámbitos cambiados, extensiones cambiadas y construye el manifiesto de CI        | Siempre en pushes y PRs que no son borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`                                        | Siempre en pushes y PRs que no son borrador |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                             | Siempre en pushes y PRs que no son borrador |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                                              | Siempre en pushes y PRs que no son borrador |
| `check-dependencies`             | Pase de Knip solo para dependencias de producción más la protección de la lista de permitidos de archivos no usados    | Cambios relevantes para Node              |
| `build-artifacts`                | Compila `dist/`, Control UI, comprobaciones de artefactos compilados y artefactos reutilizables posteriores            | Cambios relevantes para Node              |
| `checks-fast-core`               | Vías rápidas de corrección en Linux, como comprobaciones de paquetes incluidos/contrato de Plugin/protocolo            | Cambios relevantes para Node              |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado agregado estable                                  | Cambios relevantes para Node              |
| `checks-node-core-test`          | Fragmentos de pruebas de Node core, excluidas las vías de canales, paquetes incluidos, contratos y extensiones         | Cambios relevantes para Node              |
| `check`                          | Equivalente fragmentado de la puerta local principal: tipos de prod, lint, protecciones, tipos de pruebas y smoke estricto | Cambios relevantes para Node              |
| `check-additional`               | Arquitectura, límites, protecciones de superficie de extensiones, límite de paquete y fragmentos de gateway-watch      | Cambios relevantes para Node              |
| `build-smoke`                    | Pruebas smoke de CLI compilado y smoke de memoria de arranque                                                          | Cambios relevantes para Node              |
| `checks`                         | Verificador para pruebas de canales de artefactos compilados                                                           | Cambios relevantes para Node              |
| `checks-node-compat-node22`      | Vía de compilación y smoke de compatibilidad con Node 22                                                               | Ejecución manual de CI para lanzamientos  |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos de la documentación                                                    | Documentación modificada                  |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                                                       | Cambios relevantes para Skills de Python  |
| `checks-windows`                 | Pruebas específicas de Windows para procesos/rutas más regresiones compartidas de especificadores de importación en runtime | Cambios relevantes para Windows           |
| `macos-node`                     | Vía de pruebas TypeScript de macOS usando los artefactos compilados compartidos                                        | Cambios relevantes para macOS             |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                                              | Cambios relevantes para macOS             |
| `android`                        | Pruebas unitarias de Android para ambos flavors más una compilación de APK debug                                       | Cambios relevantes para Android           |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex después de actividad confiable                                          | Éxito de CI en main o ejecución manual    |
| `openclaw-performance`           | Informes diarios/bajo demanda de rendimiento del runtime de Kova con vías mock-provider, deep-profile y GPT 5.4 live  | Programado y ejecución manual             |

## Orden fail-fast

1. `preflight` decide qué vías existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matrices de plataformas.
3. `build-artifacts` se solapa con las vías rápidas de Linux para que los consumidores posteriores puedan empezar en cuanto la compilación compartida esté lista.
4. Las vías más pesadas de plataforma y runtime se expanden después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trata eso como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se pongan en cola después de que todo el flujo de trabajo ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en progreso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección de ámbitos cambiados y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Las ediciones del flujo de trabajo de CI** validan el grafo de CI de Node más el linting del flujo de trabajo, pero por sí solas no fuerzan compilaciones nativas de Windows, Android o macOS; esas vías de plataforma siguen limitadas a cambios de código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas baratas de fixtures de pruebas core y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de Plugin** usan una ruta rápida de manifiesto solo para Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canales, fragmentos core completos, fragmentos de Plugin incluidos y matrices adicionales de protecciones cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** se limitan a wrappers específicos de Windows para procesos/rutas, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan esa vía; los cambios no relacionados de código fuente, Plugin, install-smoke y solo pruebas permanecen en las vías de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar runners de más: los contratos de canales se ejecutan como tres fragmentos ponderados, las vías unitarias core pequeñas se emparejan, auto-reply se ejecuta como cuatro workers equilibrados (con el subárbol de reply dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de Gateway/Plugin se distribuyen entre los trabajos de Node agentic existentes solo de código fuente en lugar de esperar artefactos compilados. Las pruebas amplias de navegador, QA, medios y plugins misceláneos usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos por patrones de inclusión registran entradas de tiempos usando el nombre del fragmento de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de límite de paquete y separa la arquitectura de topología de runtime de la cobertura de gateway watch; el fragmento de protección de límites ejecuta sus pequeñas protecciones independientes en paralelo dentro de un trabajo. Gateway watch, las pruebas de canales y el fragmento core de límites de soporte se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya están compilados.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y después compila el APK debug de Play. El flavor third-party no tiene un source set ni manifiesto separados; su vía de pruebas unitarias aún compila el flavor con las banderas BuildConfig de SMS/call-log, mientras evita un trabajo duplicado de empaquetado de APK debug en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip solo para dependencias de producción fijado a la versión más reciente de Knip, con la edad mínima de lanzamiento de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos no usados en producción de Knip con `scripts/deadcode-unused-files.allowlist.mjs`. La protección de archivos no usados falla cuando un PR añade un archivo no usado nuevo sin revisar o deja una entrada obsoleta en la lista de permitidos, mientras preserva superficies intencionales de Plugin dinámico, generadas, de compilación, pruebas live y puentes de paquete que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El flujo de trabajo crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro vías:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

La vía `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debería publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Las aperturas rutinarias, ediciones, rotación de bots, ruido duplicado de webhook y tráfico normal de revisiones deberían resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables a lo largo de esta ruta. Son entrada para resumen y triaje, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de cada carril con ámbito no Android: fragmentos de Linux Node, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de la interfaz de usuario de Control. Las ejecuciones manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas de versión completa habilita Android pasando `include_android=true`. Las comprobaciones estáticas de preversión de plugins, el fragmento exclusivo de versión `agentic-plugins`, el barrido completo por lotes de extensiones y los carriles Docker de preversión de plugins están excluidos de CI. El conjunto de preversión de Docker se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo independiente `Plugin Prerelease` con la puerta de validación de versión habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que un conjunto completo de candidato de versión no se cancele por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite que un llamador de confianza ejecute ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de flujo de trabajo de la ref de despacho seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidas, comprobaciones fragmentadas de contratos de canales, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu hospedado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Linux Node, fragmentos de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
```

El flujo de trabajo instala OCM desde una versión fijada y Kova desde la entrada fijada `kova_ref`, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/traza para puntos críticos de arranque, Gateway y turno de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondeos de código fuente nativos de OpenClaw después del pase de Kova: tiempos de arranque y memoria del Gateway en casos de inicio predeterminado, con hook y con 50 plugins; bucles repetidos de saludo mock-OpenAI `channel-chat-baseline`; y comandos de arranque de CLI contra el Gateway iniciado. El resumen Markdown del sondeo de código fuente vive en `source/index.md` en el paquete de informe, con el JSON sin procesar junto a él.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondeo de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. El puntero de rama actual se escribe como `openclaw-performance/<ref>/latest-<lane>.json`.

## Validación de versión completa

`Full Release Validation` es el flujo de trabajo manual paraguas para "ejecutarlo todo antes de la versión". Acepta una rama, etiqueta o SHA de commit completo, despacha el flujo de trabajo manual `CI` con ese destino, despacha `Plugin Prerelease` para pruebas exclusivas de versión de plugins/paquetes/estáticas/Docker, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, suites de ruta de versión de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de versión. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo carril de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación de versión completa](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de flujo de trabajo, las diferencias de perfiles, los artefactos y
los identificadores de reejecución enfocados.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de versión. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de versión y después de que el
preflight de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
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

Para prueba de commit fijado en una rama que avanza rápido, usa el ayudante en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de despacho de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commit sin procesar. El
ayudante empuja una rama temporal `release-ci/<sha>-...` en el SHA de destino,
despacha `Full Release Validation` desde esa ref fijada, verifica que cada `headSha` de flujo de trabajo
hijo coincida con el destino, y elimina la rama temporal cuando la
ejecución se completa. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud live/proveedor que se pasa a las comprobaciones de versión. Los
flujos de trabajo manuales de versión tienen `stable` como valor predeterminado; usa `full` solo cuando
quieras intencionalmente la matriz amplia consultiva de proveedores/medios.

- `minimum` conserva los carriles más rápidos críticos para versión de OpenAI/core.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de ejecuciones hijas despachadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y anexa tablas de trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y queda en verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado del paraguas y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo de CI completo normal, `plugin-prerelease` solo para el hijo de prelanzamiento de plugin, `release-checks` para todos los hijos de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo confiable para resolver la referencia seleccionada una sola vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al flujo de trabajo Docker de ruta de lanzamiento live/E2E como al shard de aceptación de paquete. Eso mantiene consistentes los bytes del paquete entre las cajas de lanzamiento y evita volver a empaquetar el mismo candidato en varios trabajos hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que
ya haya despachado cuando se cancela el padre, por lo que la validación más reciente de main
no queda detrás de una ejecución obsoleta de release-check de dos horas. La validación de ramas/etiquetas
de lanzamiento y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de lanzamiento conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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

Esto mantiene la misma cobertura de archivos y facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola ejecución.

Los shards nativos live de multimedia se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos multimedia solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos de contenedor no son el lugar correcto para lanzar pruebas Docker anidadas.

Los shards live de modelos/backends respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por confirmación seleccionada. El flujo de trabajo live de lanzamiento crea y sube esa imagen una vez; luego los shards live Docker de modelo, Gateway dividido por proveedor, backend CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del tiempo máximo del trabajo del flujo de trabajo, de modo que un contenedor bloqueado o una ruta de limpieza falla rápido en lugar de consumir todo el presupuesto de release-check. Si esos shards reconstruyen de forma independiente el objetivo Docker completo del código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de Paquete

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquete valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test`, e imprime la fuente, la referencia del flujo de trabajo, la referencia del paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest de paquete cuando hace falta, y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar la extracción del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego despliega esos carriles como trabajos Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram aún puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si fallaron la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Fuentes de candidatos

- `source=npm` acepta solo `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de versiones publicadas preliminares/estables.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de confirmación de `package_ref` confiable. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que la confirmación seleccionada sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un árbol de trabajo desacoplado y la empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código confiable del flujo de trabajo/arnés que ejecuta la prueba. `package_ref` es la confirmación fuente que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide confirmaciones de código fuente confiables más antiguas sin ejecutar lógica de flujo de trabajo antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad live de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se conserva para despachos independientes.

Para la política dedicada de actualización y pruebas de plugins, incluidos comandos locales,
carriles Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` y `telegram_mode=mock-openai`. Esto mantiene la prueba de migración de paquetes, actualización, limpieza de dependencias de plugins obsoletas, reparación de instalación de plugins configurados, plugin sin conexión, actualización de plugin y Telegram en el mismo tarball de paquete resuelto. Define `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm enviado en lugar del artefacto construido desde el SHA. Las comprobaciones de lanzamiento Cross-OS siguen cubriendo incorporación, instalador y comportamiento de plataforma específicos del sistema operativo; la validación de producto de paquete/actualización debería empezar con Package Acceptance. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de reserva, con valor predeterminado `openclaw@latest`; los comandos de repetición de carriles fallidos preservan esa línea base. Define `published_upgrade_survivor_baselines=all-since-2026.4.23` para expandir la CI de Full Release a cada lanzamiento npm estable desde `2026.4.23` hasta `latest`; `release-history` sigue disponible para muestreo manual más amplio con el ancla anterior a esa fecha. Define `published_upgrade_survivor_scenarios=reported-issues` para expandir las mismas líneas base entre fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de registro con tilde y raíces obsoletas de dependencias heredadas de plugins. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un único carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta incorporada de comando `openclaw config set`, registra los pasos de la receta en `summary.json`, y sondea `/healthz`, `/readyz`, además del estado RPC después del arranque de Gateway. Los carriles nuevos empaquetados e instaladores de Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta cruda de Windows. El smoke de turno de agente Cross-OS de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.4`, para que la prueba de instalación y Gateway se mantenga en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas QA privadas conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa bandera;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture de git falso derivado del tarball y puede registrar `update.channel` persistido faltante;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración sin dejar de exigir que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquete, comienza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Luego inspecciona la ejecución secundaria de `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de lanes, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o las lanes de Docker exactas en lugar de volver a ejecutar la validación completa de lanzamiento.

## Prueba rápida de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura de prueba rápida en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquete, cambios de paquete/manifiesto de Plugin incluido, o superficies del core de Plugin/canal/Gateway/SDK de Plugin que ejercitan los jobs de prueba rápida de Docker. Los cambios solo de código fuente en Plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida construye una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta la prueba rápida de CLI de eliminación de agentes en workspace compartido, ejecuta el E2E de red de Gateway en contenedor, verifica un argumento de build de extensión incluida y ejecuta el perfil acotado de Docker para Plugins incluidos bajo un timeout agregado de comando de 240 segundos (cada ejecución de Docker de cada escenario se limita por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura de Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento por llamada de flujo de trabajo y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen GHCR de prueba rápida del Dockerfile raíz para el SHA objetivo, y luego ejecuta la instalación de paquete QR, pruebas rápidas de Dockerfile raíz/Gateway, pruebas rápidas de instalador/actualización y el E2E rápido de Docker para Plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de las pruebas rápidas de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el flujo de trabajo conserva la prueba rápida de Docker y deja la prueba rápida completa de instalación para la validación nocturna o de lanzamiento.

La prueba rápida lenta del proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden activarla, pero los pull requests y los pushes a `main` no. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` preconstruye una imagen compartida de prueba live, empaqueta OpenClaw una vez como tarball npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor básico de Node/Git para lanes de instalador/actualización/dependencias de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                          |
| -------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                   | Recuento de ranuras del pool principal para lanes normales.                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                   | Recuento de ranuras del pool final sensible a proveedores.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                    | Límite de lanes live concurrentes para que los proveedores no apliquen throttling.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                   | Límite de lanes concurrentes de instalación npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                    | Límite de lanes multiservicio concurrentes.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000                 | Escalonamiento entre inicios de lanes para evitar tormentas de creación del daemon de Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000              | Timeout de respaldo por lane (120 minutos); lanes live/finales seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset                | `1` imprime el plan del programador sin ejecutar lanes.                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset                | Lista exacta de lanes separada por comas; omite la prueba rápida de limpieza para que los agentes puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede iniciar desde un pool vacío, y luego se ejecuta sola hasta que libera capacidad. El agregado local hace preflights de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de lanes activas, persiste los tiempos de lanes para ordenamiento de más largas primero y deja de programar nuevas lanes agrupadas tras el primer fallo de forma predeterminada.

### Flujo de trabajo live/E2E reutilizable

El flujo de trabajo live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, lane y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y publica imágenes GHCR Docker E2E básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita lanes con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de reconstruir. Las descargas de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo atascado de registro/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada fragmento descarga solo el tipo de imagen que necesita y ejecuta varias lanes mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de lane `install-e2e` sigue siendo el alias agregado de reejecución manual para ambas lanes de instalador de proveedor.

OpenWebUI se incorpora a `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las lanes de actualización de canales incluidos reintentan una vez ante fallos transitorios de red npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de lanes, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de lanes lentas y comandos de reejecución por lane. La entrada `docker_lanes` del flujo de trabajo ejecuta lanes seleccionadas contra las imágenes preparadas en lugar de los jobs de fragmento, lo que mantiene la depuración de lanes fallidas acotada a un job Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una lane seleccionada es una lane Docker live, el job dirigido construye localmente la imagen de prueba live para esa reejecución. Los comandos generados de reejecución de GitHub por lane incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparada cuando existen esos valores, para que una lane fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El flujo de trabajo live/E2E programado ejecuta diariamente la suite completa Docker de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensión; esos jobs de shard de extensión ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no creen jobs adicionales de CI. La ruta de prelanzamiento Docker exclusiva de lanzamiento agrupa lanes Docker dirigidas en grupos pequeños para evitar reservar docenas de ejecutores para jobs de uno a tres minutos.

## Laboratorio de QA

QA Lab tiene lanes dedicadas de CI fuera del flujo de trabajo principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no como un flujo de trabajo independiente de PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y por despacho manual; despliega como jobs paralelos la lane de paridad mock, la lane live de Matrix y las lanes live de Telegram y Discord. Los jobs live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan lanes live de transporte de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia de modelos live y del inicio normal de Plugins de proveedor. El Gateway de transporte live desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, añadiendo `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; un despacho manual con `matrix_profile=all` siempre divide la cobertura completa de Matrix en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las lanes críticas de lanzamiento de QA Lab antes de la aprobación de lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y base como jobs de lane paralelos, y luego descarga ambos artefactos en un job pequeño de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad inicial y limitado, no el barrido completo del repositorio. Las ejecuciones de protección diarias, manuales y de pull request no borrador escanean el código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo se inicia para cambios en `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secretos, sandbox, Cron y línea base de Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales core más runtime de Plugin de canal, Gateway, Plugin SDK, secretos y puntos de contacto de auditoría              |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies core de SSRF, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y contrato de paquete de Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard programado de seguridad para Android. Compila manualmente la app de Android para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la comprobación de sanidad del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de seguridad semanal/manual para macOS. Compila manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard no relacionado con seguridad equivalente. Ejecuta únicamente consultas de calidad JavaScript/TypeScript de severidad error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el runner Linux de Blacksmith más pequeño. Su protección de pull requests es intencionalmente más pequeña que el perfil programado: los PR no borrador solo ejecutan los shards equivalentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de auth/secretos/sandbox/seguridad, runtime de canal core y Plugin de canal incluido, protocolo/método de servidor de Gateway, runtime de memoria/pegamento de SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de Plugin, Plugin SDK/contrato de paquete o runtime de respuesta de Plugin SDK. Los cambios de configuración de CodeQL y de flujo de trabajo de calidad ejecutan los doce shards de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de auth, secretos, sandbox, Cron y Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canal core y Plugin de canal incluido                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelo/proveedor, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias de memoria de Plugin SDK, pegamento de activación de runtime de memoria y comandos doctor de memoria                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesión saliente, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes de Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, auth y descubrimiento de proveedor, registro de runtime de proveedor, valores predeterminados/catálogos de proveedor y registros de web/búsqueda/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de Control UI, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/búsqueda web core, IO de medios, comprensión de medios, generación de imágenes y generación de medios                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y puntos de entrada de Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente de Plugin SDK del lado del paquete publicado y helpers de contrato de paquete de plugin                                                                                      |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o dividido en shards solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex controlado por eventos para mantener la documentación existente alineada con los cambios aterrizados recientemente. No tiene una programación pura: una ejecución de CI exitosa por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ya avanzó o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen del Docs Agent no omitido anterior hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex controlado por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa por push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o está en ejecución ese día UTC. El despacho manual omite esa puerta de actividad diaria. El carril crea un informe de rendimiento Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el conteo base de pruebas aprobadas. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallas obvias y el informe de suite completa posterior al agente debe pasar antes de confirmar nada. Cuando `main` avanza antes de que aterrice el push del bot, el carril rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado por GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicados después de merge

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenedor para limpieza de duplicados posterior al aterrizaje. Por defecto es dry-run y solo cierra los PR listados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación local y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta sobre los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción core ejecutan typecheck de prod core y de pruebas core más lint/guards core;
- los cambios solo de pruebas core ejecutan únicamente typecheck de pruebas core más lint core;
- los cambios de producción de extensión ejecutan typecheck de prod de extensión y de pruebas de extensión más lint de extensión;
- los cambios solo de pruebas de extensión ejecutan typecheck de pruebas de extensión más lint de extensión;
- los cambios públicos de Plugin SDK o de contrato de plugin se expanden a typecheck de extensiones porque las extensiones dependen de esos contratos core (los barridos Vitest de extensiones siguen siendo trabajo de prueba explícito);
- los bumps de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios a la configuración de respuestas visibles de grupo, al modo de entrega de respuestas de origen o al prompt de sistema de la herramienta de mensajes pasan por las pruebas core de respuesta más regresiones de entrega de Discord y Slack para que un cambio compartido predeterminado falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación con Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja calentada nueva para una prueba amplia. Antes de gastar una gate lenta en una caja que se reutilizó, expiró o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de cordura falla rápido cuando desaparecen archivos raíz obligatorios como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones con seguimiento. Eso normalmente significa que el estado de sincronización remoto no es una copia confiable del PR; detén esa caja y calienta una nueva en lugar de depurar el fallo de la prueba del producto. Para PRs intencionales con grandes eliminaciones, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de Blacksmith CLI que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es la segunda ruta de cajas remotas propiedad del repositorio para pruebas en Linux cuando Blacksmith no está disponible o cuando se prefiere capacidad en la nube propia. Calienta una caja, hidrátala mediante el flujo de trabajo del proyecto y luego ejecuta comandos a través de Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions. Excluye el `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos Git remotos en lugar de sincronizar remotos locales de mantenedores y almacenes de objetos, y excluye artefactos locales de runtime/build que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso del entorno no secreto que luego consumen los comandos `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
