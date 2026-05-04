---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Estás cambiando el dispatch de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-04T05:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El job `preflight` clasifica el diff y desactiva lanes costosos cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan el grafo completo para candidatos de release y validación amplia. Los lanes de Android permanecen como opt-in mediante `include_android`. La cobertura de plugins solo para releases vive en el workflow separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o mediante un dispatch manual explícito.

## Resumen del pipeline

| Job                              | Propósito                                                                                                   | Cuándo se ejecuta                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `preflight`                      | Detecta cambios solo de docs, alcances modificados, extensiones modificadas y construye el manifiesto de CI | Siempre en pushes y PRs no draft        |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                                     | Siempre en pushes y PRs no draft        |
| `security-dependency-audit`      | Auditoría sin dependencias del lockfile de producción contra avisos de npm                                  | Siempre en pushes y PRs no draft        |
| `security-fast`                  | Agregado requerido para los jobs rápidos de seguridad                                                       | Siempre en pushes y PRs no draft        |
| `check-dependencies`             | Pasada de Knip solo para dependencias de producción más el guard de allowlist de archivos no usados          | Cambios relevantes para Node            |
| `build-artifacts`                | Construye `dist/`, Control UI, checks de artefactos construidos y artefactos downstream reutilizables       | Cambios relevantes para Node            |
| `checks-fast-core`               | Lanes rápidos de corrección en Linux como checks de bundled/plugin-contract/protocol                         | Cambios relevantes para Node            |
| `checks-fast-contracts-channels` | Checks de contratos de canales shardeados con un resultado agregado estable                                 | Cambios relevantes para Node            |
| `checks-node-core-test`          | Shards de tests core de Node, excluyendo lanes de canales, bundled, contratos y extensiones                 | Cambios relevantes para Node            |
| `check`                          | Equivalente shardeado del gate local principal: tipos de prod, lint, guards, tipos de test y smoke estricto | Cambios relevantes para Node            |
| `check-additional`               | Arquitectura, drift shardeado de boundaries/prompts, guards de extensiones, boundary de paquetes y gateway watch | Cambios relevantes para Node        |
| `build-smoke`                    | Tests smoke de CLI construida y smoke de memoria de arranque                                                | Cambios relevantes para Node            |
| `checks`                         | Verificador para tests de canales de artefactos construidos                                                 | Cambios relevantes para Node            |
| `checks-node-compat-node22`      | Lane de build y smoke de compatibilidad con Node 22                                                         | Dispatch manual de CI para releases     |
| `check-docs`                     | Formato, lint y checks de enlaces rotos de docs                                                             | Docs modificados                        |
| `skills-python`                  | Ruff + pytest para skills respaldadas por Python                                                            | Cambios relevantes para skills de Python |
| `checks-windows`                 | Tests específicos de Windows de procesos/rutas más regresiones compartidas de especificadores de import runtime | Cambios relevantes para Windows     |
| `macos-node`                     | Lane de tests TypeScript de macOS usando los artefactos construidos compartidos                             | Cambios relevantes para macOS           |
| `macos-swift`                    | Lint, build y tests de Swift para la app de macOS                                                           | Cambios relevantes para macOS           |
| `android`                        | Tests unitarios de Android para ambos flavors más un build de APK debug                                     | Cambios relevantes para Android         |
| `test-performance-agent`         | Optimización diaria de tests lentos de Codex después de actividad confiable                                 | Éxito de CI en main o dispatch manual   |
| `openclaw-performance`           | Informes diarios/bajo demanda de rendimiento runtime de Kova con lanes mock-provider, deep-profile y GPT 5.4 live | Programado y dispatch manual      |

## Orden fail-fast

1. `preflight` decide qué lanes existen. La lógica `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los jobs más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con los lanes rápidos de Linux para que los consumidores downstream puedan empezar en cuanto el build compartido esté listo.
4. Los lanes más pesados de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando llega un push más reciente al mismo PR o ref `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Los checks agregados de shards usan `!cancelled() && always()` para que sigan informando fallos normales de shards pero no se encolen cuando todo el workflow ya fue reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombie del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por tests unitarios en `src/scripts/ci-changed-scope.test.ts`. El dispatch manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Ediciones de workflows de CI** validan el grafo de CI de Node más el linting de workflows, pero no fuerzan por sí solas builds nativos de Windows, Android o macOS; esos lanes de plataforma permanecen acotados a cambios en el código fuente de la plataforma.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratos de core-test y ediciones estrechas de helpers/enrutamiento de tests de contratos de plugins** usan una ruta rápida de manifiesto solo Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, shards completos de core, shards de bundled-plugin y matrices adicionales de guards cuando el cambio está limitado a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Checks Node de Windows** están acotados a wrappers específicos de Windows para procesos/rutas, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies del workflow de CI que ejecutan ese lane; los cambios no relacionados en código fuente, plugins, install-smoke y solo tests permanecen en los lanes Node de Linux.

Las familias de tests Node más lentas se dividen o equilibran para que cada job permanezca pequeño sin sobrerreservar runners: los contratos de canales se ejecutan como tres shards ponderados, los lanes core unit fast/support se ejecutan por separado, la infraestructura runtime core se divide entre shards de state y process/config, auto-reply se ejecuta como workers equilibrados (con el subárbol de reply dividido en shards agent-runner, dispatch y commands/state-routing), y las configuraciones agentic gateway/server se dividen en lanes chat/auth/model/http-plugin/runtime/startup en lugar de esperar a los artefactos construidos. Los tests amplios de navegador, QA, media y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards include-pattern registran entradas de timing usando el nombre del shard de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado. `check-additional` mantiene juntos el trabajo de compilación/canary de package-boundary y separa la arquitectura de topología runtime de la cobertura de gateway watch; la lista de guards de boundary se distribuye en cuatro shards de matriz, cada uno ejecutando guards independientes seleccionados en paralelo e imprimiendo timings por check, incluido `pnpm prompt:snapshots:check`, para que el drift de prompts del happy path runtime de Codex quede fijado al PR que lo causó. Gateway watch, tests de canales y el shard core support-boundary se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK debug de Play. El flavor third-party no tiene source set ni manifiesto separados; su lane de tests unitarios todavía compila el flavor con las flags BuildConfig de SMS/call-log, evitando al mismo tiempo un job duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la última versión de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción no usados de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos no usados falla cuando un PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la allowlist, preservando a la vez superficies intencionales de plugins dinámicos, generadas, de build, live-test y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de item, URL, título, estado y extractos cortos de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Las aperturas rutinarias, ediciones, ruido de bots, ruido duplicado de webhooks y tráfico normal de revisiones deben resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisiones, nombres de ramas y mensajes de commit de GitHub como datos no confiables en todo este recorrido. Son entrada para resumen y triage, no instrucciones para el workflow ni el runtime del agente.

## Dispatches manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan todas las lanes con alcance no Android: shards de Linux Node, shards de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de build, comprobaciones de documentación, Skills de Python, Windows, macOS y Control UI i18n. Las ejecuciones manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas de release completo habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de plugins, el shard exclusivo de release `agentic-plugins`, el barrido por lotes completo de extensiones y las lanes de Docker de prerelease de plugins se excluyen de CI. La suite de prerelease de Docker se ejecuta solo cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con la gate de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de release candidate no se cancele por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite que un llamador de confianza ejecute ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de workflow de la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, trabajos y agregados rápidos de seguridad (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/plugins incluidos, comprobaciones de contratos de canales en shards, shards de `check` excepto lint, shards y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; la preflight de install-smoke también usa Ubuntu hospedado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de pruebas de Linux Node, shards de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); builds de Docker de install-smoke (el coste del tiempo de cola de 32 vCPU era mayor que el ahorro)                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` es el workflow de rendimiento del producto/runtime. Se ejecuta a diario en `main` y se puede despachar manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El dispatch manual normalmente evalúa la ref del workflow. Define `target_ref` para evaluar una etiqueta de release u otra rama con la implementación actual del workflow. Las rutas de los informes publicados y los punteros más recientes se indexan por la ref probada, y cada `index.md` registra la ref/SHA probado, la ref/SHA del workflow, la ref de Kova, el perfil, el modo de autenticación de lane, el modelo, el recuento de repeticiones y los filtros de escenarios.

El workflow instala OCM desde una release fijada y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`; luego ejecuta tres lanes:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de build local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/trace para puntos críticos de inicio, Gateway y turno de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

La lane mock-provider también ejecuta sondas de origen nativas de OpenClaw después del pase de Kova: tiempo de arranque y memoria del Gateway en casos de inicio predeterminado, con hook y con 50 plugins; bucles de saludo repetidos de mock-OpenAI `channel-chat-baseline`; y comandos de inicio de CLI contra el Gateway arrancado. El resumen Markdown de la sonda de origen está en `source/index.md` dentro del paquete de informe, con JSON sin procesar junto a él.

Cada lane sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el workflow también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondas de origen en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la ref probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación de release completa

`Full Release Validation` es el workflow paraguas manual para "ejecutar todo antes del release". Acepta una rama, etiqueta o SHA de commit completo, despacha el workflow manual `CI` con ese destino, despacha `Plugin Prerelease` para pruebas exclusivas de release de plugins/paquetes/estáticas/Docker y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, suites de rutas de release de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y lanes de Telegram. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de release. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar la misma lane de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación de release completa](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos del workflow, las diferencias de perfiles, los artefactos y
los identificadores de repetición enfocados.

`OpenClaw Release Publish` es el workflow manual mutante de release. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de release y después de que la
preflight de npm de OpenClaw se haya completado correctamente. Verifica `pnpm plugins:sync:check`,
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

Para prueba de commit fijado en una rama que avanza rápido, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de dispatch de workflows de GitHub deben ser ramas o etiquetas, no SHAs de commit sin procesar. El
helper empuja una rama temporal `release-ci/<sha>-...` en el SHA de destino,
despacha `Full Release Validation` desde esa ref fijada, verifica que cada
`headSha` de workflow hijo coincida con el destino y elimina la rama temporal cuando la
ejecución termina. El verificador paraguas también falla si algún workflow hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud de live/provider que se pasa a las comprobaciones de lanzamiento. Los
flujos de trabajo manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia de proveedor/medios de aviso.

- `minimum` conserva los carriles más rápidos de OpenAI/núcleo críticos para el lanzamiento.
- `stable` agrega el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia de proveedor/medios de aviso.

El paraguas registra los ids de las ejecuciones secundarias despachadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones secundarias y agrega tablas de los trabajos más lentos para cada ejecución secundaria. Si se vuelve a ejecutar un flujo de trabajo secundario y pasa a verde, vuelve a ejecutar solo el trabajo verificador principal para actualizar el resultado del paraguas y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el secundario normal de CI completa, `plugin-prerelease` solo para el secundario de prelanzamiento de plugins, `release-checks` para cada secundario de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la nueva ejecución de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo confiable para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al flujo de trabajo Docker de ruta de lanzamiento live/E2E como al fragmento de aceptación de paquetes. Eso mantiene coherentes los bytes del paquete entre cajas de lanzamiento y evita volver a empaquetar el mismo candidato en varios trabajos secundarios.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan al paraguas anterior. El monitor principal cancela cualquier flujo de trabajo secundario que
ya haya despachado cuando se cancela el principal, por lo que la validación más reciente de main
no queda detrás de una ejecución obsoleta de dos horas de comprobaciones de lanzamiento. La validación de ramas/etiquetas
de lanzamiento y los grupos de nueva ejecución enfocados mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El secundario live/E2E de lanzamiento conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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
- fragmentos divididos de audio/video de medios y fragmentos de música filtrados por proveedor

Eso conserva la misma cobertura de archivos a la vez que facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres de fragmentos agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para nuevas ejecuciones manuales puntuales.

Los fragmentos nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en ejecutores Blacksmith normales: los trabajos de contenedor son el lugar incorrecto para lanzar pruebas Docker anidadas.

Los fragmentos live de modelos/backends respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El flujo de trabajo live de lanzamiento crea y publica esa imagen una vez, y luego los fragmentos de modelo live Docker, Gateway segmentado por proveedor, backend CLI, enlace ACP y harness Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del tiempo de espera del trabajo del flujo de trabajo, de modo que un contenedor bloqueado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de comprobaciones de lanzamiento. Si esos fragmentos vuelven a crear independientemente el objetivo Docker completo de origen, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación del paquete

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es distinto de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo harness Docker E2E que ejercitan los usuarios después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime la fuente, la referencia del flujo de trabajo, la referencia del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker de resumen de paquete cuando es necesario y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona múltiples `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos carriles como trabajos Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando la Aceptación del paquete resolvió uno; el despacho independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw, como `openclaw@2026.4.27-beta.2`. Usa esto para aceptación de prelanzamientos/estables publicados.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de `package_ref` confiable. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala dependencias en un worktree desacoplado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe suministrarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código confiable del flujo de trabajo/harness que ejecuta la prueba. `package_ref` es el commit fuente que se empaqueta cuando `source=ref`. Esto permite que el harness de prueba actual valide commits de origen confiables antiguos sin ejecutar lógica antigua de flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad live de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada reservada para despachos independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
carriles Docker, entradas de Aceptación del paquete, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a la Aceptación del paquete con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, la actualización, la limpieza de dependencias de plugins obsoletas, la reparación de instalación de plugins configurados, el plugin sin conexión, la actualización de plugins y la prueba de Telegram en el mismo tarball de paquete resuelto. Configura `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm enviado en lugar del artefacto creado desde el SHA. Las comprobaciones de lanzamiento entre sistemas operativos aún cubren el onboarding, el instalador y el comportamiento de plataforma específicos del SO; la validación de producto de paquete/actualización debe empezar con la Aceptación del paquete. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución. En Aceptación del paquete, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de nueva ejecución de carriles fallidos preservan esa línea base. Configura `published_upgrade_survivor_baselines=all-since-2026.4.23` para expandir la CI de lanzamiento completa a cada lanzamiento npm estable desde `2026.4.23` hasta `latest`; `release-history` sigue disponible para muestreos manuales más amplios con el ancla anterior a la fecha antigua. Configura `published_upgrade_survivor_scenarios=reported-issues` para expandir las mismas líneas base entre fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones de plugins de OpenClaw configurados, rutas de log con tilde y raíces de dependencias de plugins heredadas obsoletas. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es la limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de CI de lanzamiento completa. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar un único carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, o configurar `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta integrada de comandos `openclaw config set`, registra pasos de receta en `summary.json` y sondea `/healthz`, `/readyz` y el estado RPC después del inicio de Gateway. Los carriles nuevos empaquetados y de instalador de Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta Windows sin procesar. El smoke de turno de agente OpenAI entre sistemas operativos usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está configurado; de lo contrario, `openai/gpt-5.4`, por lo que la prueba de instalación y Gateway permanece en un modelo de prueba GPT-5 y evita valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

La Aceptación del paquete tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa bandera;
- `update-channel-switch` puede eliminar `pnpm.patchedDependencies` faltantes del fixture falso de git derivado del tarball y puede registrar `update.channel` persistido faltante;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que falte la persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento de no reinstalación permanezcan sin cambios.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución secundaria de `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de lanes, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o las lanes exactas de Docker en lugar de volver a ejecutar la validación de release completa.

## Smoke de instalación

El workflow separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura de smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios en paquetes/manifiestos de Plugin incluidos, o superficies de Plugin principal/canal/Gateway/Plugin SDK que ejercitan los jobs de smoke de Docker. Los cambios de solo código fuente en Plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida construye una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes en el workspace compartido, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de build de extensión incluida y ejecuta el perfil acotado de Docker para Plugins incluidos con un timeout agregado de comando de 240 segundos (con cada ejecución de Docker del escenario limitada por separado).
- **Ruta completa** mantiene la instalación de paquete QR y la cobertura de Docker/update del instalador para ejecuciones programadas nocturnas, despachos manuales, comprobaciones de release con workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de smoke del Dockerfile raíz de GHCR con SHA objetivo, luego ejecuta la instalación de paquete QR, smokes de Dockerfile raíz/Gateway, smokes de instalador/update y el E2E rápido de Docker para Plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow conserva el smoke rápido de Docker y deja el smoke completo de instalación para la validación nocturna o de release.

El smoke lento de proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de release, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas QR y de Docker del instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` preconstruye una imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como tarball de npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner Node/Git básico para lanes de instalador/update/dependencias de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes de Docker residen en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador reside en `scripts/lib/docker-e2e-plan.mjs` y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Recuento de slots del pool principal para lanes normales.                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Recuento de slots del pool final sensible a proveedores.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de lanes en vivo concurrentes para que los proveedores no apliquen throttling.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de lanes concurrentes de instalación de npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de lanes multiservicio concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Separación entre inicios de lanes para evitar tormentas de creación del daemon de Docker; define `0` para no usar separación. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de respaldo por lane (120 minutos); las lanes en vivo/finales seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del programador sin ejecutar lanes.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de lanes separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede empezar desde un pool vacío y luego se ejecuta sola hasta que libera capacidad. Los preflights agregados locales comprueban Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten estado de lanes activas, persisten tiempos de lanes para ordenación de mayor a menor duración y dejan de programar nuevas lanes agrupadas tras el primer fallo de forma predeterminada.

### Workflow reutilizable en vivo/E2E

El workflow reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, lane y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y publica imágenes GHCR Docker E2E básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas de Docker de Blacksmith cuando el plan necesita lanes con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de reconstruir. Los pulls de imágenes de Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo bloqueado de registro/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de release

La cobertura de Docker de release ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute varias lanes mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos actuales de Docker de release son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de lane `install-e2e` sigue siendo el alias agregado de reejecución manual para ambas lanes de instalador de proveedor.

OpenWebUI se incorpora a `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las lanes de update de canales incluidos reintentan una vez en caso de fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de lanes, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de lanes lentas y comandos de reejecución por lane. La entrada `docker_lanes` del workflow ejecuta lanes seleccionadas contra las imágenes preparadas en lugar de los jobs de fragmentos, lo que mantiene la depuración de lanes fallidas acotada a un job de Docker específico y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una lane seleccionada es una lane de Docker en vivo, el job específico construye localmente la imagen de pruebas en vivo para esa reejecución. Los comandos generados de reejecución de GitHub por lane incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, de modo que una lane fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow programado en vivo/E2E ejecuta diariamente la suite completa de Docker de release-path.

## Prerelease de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra pruebas de Plugins incluidos entre ocho workers de extensión; esos jobs de shards de extensión ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker de Vitest por grupo y un heap de Node mayor para que los lotes de Plugins con muchas importaciones no creen jobs adicionales de CI. La ruta de prerelease de Docker exclusiva de release agrupa lanes de Docker específicas en grupos pequeños para evitar reservar decenas de runners para jobs de uno a tres minutos.

## QA Lab

QA Lab tiene lanes de CI dedicadas fuera del workflow principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y release, no como un workflow independiente de PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución de validación amplia.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante despacho manual; despliega la lane de paridad simulada, la lane de Matrix en vivo y las lanes de Telegram y Discord en vivo como jobs paralelos. Los jobs en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de release ejecutan las lanes de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados para mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia de modelos en vivo y del arranque normal de Plugins de proveedor. El Gateway de transporte en vivo desactiva la búsqueda en memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores se cubre mediante las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para gates programados y de release, añadiendo `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide en shards la cobertura completa de Matrix en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las lanes críticas de release de QA Lab antes de la aprobación de release; su gate de paridad de QA ejecuta los paquetes candidato y baseline como jobs de lane paralelos, luego descarga ambos artefactos en un job de informe pequeño para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad inicial y acotado, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de solicitudes de extracción no borrador escanean código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de solicitudes de extracción se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Línea base de autenticación, secretos, sandbox, cron y Gateway                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación del canal principal más el runtime del plugin de canal, Gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies principales de SSRF, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y controles de ejecución de herramientas de agente              |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de código fuente y contrato de paquete de Plugin SDK |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila manualmente la aplicación Android para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la comprobación de cordura del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Compila manualmente la aplicación macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento equivalente que no es de seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript sin seguridad y de severidad de error sobre superficies estrechas de alto valor en el runner Blacksmith Linux más pequeño. Su protección de solicitudes de extracción es intencionalmente más pequeña que el perfil programado: las PR no borrador solo ejecutan los fragmentos coincidentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, canal principal y runtime del plugin de canal incluido, protocolo/método de servidor de Gateway, runtime de memoria/glue de SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de Plugin, Plugin SDK/contrato de paquete o runtime de respuestas de Plugin SDK. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, cron y Gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal principal y del plugin de canal incluido                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas del runtime de memoria, alias de Plugin SDK de memoria, glue de activación del runtime de memoria y comandos de doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesión saliente, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes de Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/búsqueda/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la UI de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime principales de fetch/búsqueda web, IO de medios, comprensión de medios, generación de imágenes y generación de medios                         |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y punto de entrada de Plugin SDK                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente de Plugin SDK del lado del paquete publicado y helpers de contrato de paquete de plugin                                                              |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan tiempo de ejecución y señal estables.

## Flujos de trabajo de mantenimiento

### Docs Agent

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex dirigida por eventos para mantener la documentación existente alineada con cambios aterrizados recientemente. No tiene una programación pura: una ejecución de CI correcta de un push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen del Docs Agent no omitido anterior hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Test Performance Agent

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex dirigida por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI correcta de un push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o está en ejecución ese día UTC. El despacho manual omite esa barrera de actividad diaria. La vía genera un informe completo de rendimiento de Vitest agrupado de toda la suite, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de toda la suite y rechaza cambios que reduzcan el recuento de pruebas aprobadas de la línea base. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de toda la suite posterior al agente debe aprobar antes de que se confirme cualquier cosa. Cuando `main` avanza antes de que aterrice el push del bot, la vía hace rebase del parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado por GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicadas después de merge

El flujo de trabajo `Duplicate PRs After Merge` es un flujo manual de mantenedor para limpieza de duplicados posterior al aterrizaje. Por defecto es dry-run y solo cierra las PR listadas explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que la PR aterrizada esté fusionada y que cada duplicada tenga una incidencia referenciada compartida o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación locales y enrutamiento de cambios

La lógica local de vías cambiadas vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta sobre los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción en el core ejecutan typecheck de producción y de pruebas del core más lint/controles del core;
- los cambios solo de pruebas del core ejecutan solo typecheck de pruebas del core más lint del core;
- los cambios de producción en extensiones ejecutan typecheck de producción y de pruebas de extensiones más lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones más lint de extensiones;
- los cambios públicos de Plugin SDK o de contrato de plugin se expanden a typecheck de extensiones porque las extensiones dependen de esos contratos del core (los barridos de extensiones de Vitest siguen siendo trabajo de prueba explícito);
- los incrementos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de comprobación.

El enrutamiento local de pruebas cambiadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren asignaciones explícitas, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible de grupo, el modo de entrega de respuestas de origen o el prompt del sistema de la herramienta de mensajes pasan por las pruebas de respuestas del core más regresiones de entrega de Discord y Slack para que un cambio de valor predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto asignado barato no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja nueva ya calentada para una prueba amplia. Antes de gastar una puerta de validación lenta en una caja que fue reutilizada, expiró o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de cordura falla rápido cuando desaparecieron archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones con seguimiento. Eso normalmente significa que el estado de sincronización remota no es una copia confiable del PR; detén esa caja y calienta una nueva en lugar de depurar el fallo de la prueba del producto. Para PRs intencionales con muchas eliminaciones, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es el wrapper de cajas remotas propio del repositorio para pruebas de Linux de maintainers. Úsalo cuando una comprobación sea demasiado amplia para un bucle local de edición, cuando importe la paridad con CI o cuando la prueba necesite secretos, Docker, carriles de paquete, cajas reutilizables o registros remotos. El backend normal de OpenClaw es `blacksmith-testbox`; la capacidad propia de AWS/Hetzner es una alternativa para caídas de Blacksmith, problemas de cuota o pruebas explícitas con capacidad propia.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario obsoleto de Crabbox que no anuncia `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia.

Puerta de validación de cambios:

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

Usa la reutilización solo cuando intencionalmente necesites varios comandos en la misma caja hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directo como alternativa limitada:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` es dueño de los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para los carriles de nube propia. Excluye el `.git` local para que el checkout hidratado de Actions mantenga sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales de maintainers, y excluye artefactos locales de runtime/build que nunca deberían transferirse. `.github/workflows/crabbox-hydrate.yml` es dueño del checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia de entorno no secreta para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
