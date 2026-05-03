---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no.
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-03T21:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva las líneas costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan el grafo completo para candidatos de lanzamiento y validación amplia. Las líneas de Android siguen siendo opcionales mediante `include_android`. La cobertura de plugins solo para lanzamientos vive en el flujo de trabajo separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o una ejecución manual explícita.

## Descripción general de la canalización

| Trabajo                          | Propósito                                                                                                 | Cuándo se ejecuta                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar cambios solo de documentación, ámbitos modificados, extensiones modificadas y construir el manifiesto de CI | Siempre en pushes y PRs no borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`                           | Siempre en pushes y PRs no borrador |
| `security-dependency-audit`      | Auditoría del lockfile de producción, sin dependencias, contra avisos de npm                              | Siempre en pushes y PRs no borrador |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                                 | Siempre en pushes y PRs no borrador |
| `check-dependencies`             | Pase de Knip solo de dependencias de producción más la guarda de la lista permitida de archivos no usados | Cambios relevantes para Node       |
| `build-artifacts`                | Construir `dist/`, Control UI, comprobaciones de artefactos construidos y artefactos reutilizables posteriores | Cambios relevantes para Node       |
| `checks-fast-core`               | Líneas rápidas de corrección en Linux, como comprobaciones de bundled/plugin-contract/protocol            | Cambios relevantes para Node       |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado de comprobación agregado estable     | Cambios relevantes para Node       |
| `checks-node-core-test`          | Fragmentos de pruebas de Node núcleo, excluidas las líneas de canales, bundled, contratos y extensiones   | Cambios relevantes para Node       |
| `check`                          | Equivalente fragmentado de la puerta local principal: tipos de prod, lint, guardas, tipos de pruebas y smoke estricto | Cambios relevantes para Node       |
| `check-additional`               | Arquitectura, deriva fragmentada de límites/prompts, guardas de extensiones, límite de paquetes y observación del Gateway | Cambios relevantes para Node       |
| `build-smoke`                    | Pruebas smoke de la CLI construida y smoke de memoria de arranque                                         | Cambios relevantes para Node       |
| `checks`                         | Verificador para pruebas de canales de artefactos construidos                                             | Cambios relevantes para Node       |
| `checks-node-compat-node22`      | Línea de compilación y smoke de compatibilidad con Node 22                                                | Ejecución manual de CI para lanzamientos |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos de la documentación                                       | Documentación modificada           |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                                          | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Pruebas específicas de Windows de procesos/rutas más regresiones compartidas de especificadores de importación en runtime | Cambios relevantes para Windows    |
| `macos-node`                     | Línea de pruebas de TypeScript en macOS usando los artefactos construidos compartidos                     | Cambios relevantes para macOS      |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                                 | Cambios relevantes para macOS      |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una compilación de APK de depuración                  | Cambios relevantes para Android    |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex después de actividad confiable                            | Éxito de CI en main o ejecución manual |
| `openclaw-performance`           | Informes diarios/bajo demanda de rendimiento de runtime de Kova con líneas de mock-provider, deep-profile y GPT 5.4 live | Programada y ejecución manual      |

## Orden de fallo rápido

1. `preflight` decide qué líneas existen en absoluto. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con las líneas rápidas de Linux para que los consumidores posteriores puedan iniciar en cuanto la compilación compartida esté lista.
4. Las líneas más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando un push más nuevo llega al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más nueva para el mismo ref también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se pongan en cola después de que todo el flujo de trabajo ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones de main más nuevas. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Ámbito y enrutamiento

La lógica de ámbito vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con ámbito hubiera cambiado.

- **Las ediciones del flujo de trabajo de CI** validan el grafo de CI de Node más el lint de flujos de trabajo, pero no fuerzan por sí mismas compilaciones nativas de Windows, Android o macOS; esas líneas de plataforma siguen limitadas a cambios de código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratos de pruebas del núcleo y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canales, fragmentos completos del núcleo, fragmentos de plugins bundled y matrices de guardas adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** se limitan a wrappers específicos de Windows de procesos/rutas, helpers de ejecutores npm/pnpm/UI, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan esa línea; los cambios no relacionados de código fuente, plugins, install-smoke y solo pruebas permanecen en las líneas de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin sobrerreservar ejecutores: los contratos de canales se ejecutan como tres fragmentos ponderados, las líneas rápidas/de soporte de unidades del núcleo se ejecutan por separado, la infraestructura de runtime del núcleo se divide entre fragmentos de estado y proceso/configuración, auto-reply se ejecuta como workers equilibrados (con el subárbol de respuestas dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/servidor se dividen entre líneas de chat/auth/model/http-plugin/runtime/startup en lugar de esperar a artefactos construidos. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos include-pattern registran entradas de tiempos usando el nombre del fragmento de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de límites de paquetes y separa la arquitectura de topología de runtime de la cobertura de observación del Gateway; la lista de guardas de límites se reparte en cuatro fragmentos de matriz, cada uno ejecuta guardas independientes seleccionadas en paralelo e imprime tiempos por comprobación, incluido `pnpm prompt:snapshots:check`, de modo que la deriva de prompts del happy path del runtime de Codex quede fijada al PR que la causó. La observación del Gateway, las pruebas de canales y el fragmento de límites de soporte del núcleo se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK de depuración de Play. El sabor de terceros no tiene un source set ni manifiesto separado; su línea de pruebas unitarias todavía compila el sabor con las banderas BuildConfig de SMS/call-log, evitando a la vez un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip solo de dependencias de producción fijado a la última versión de Knip, con la antigüedad mínima de lanzamiento de pnpm deshabilitada para la instalación de `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción no usados de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. La guarda de archivos no usados falla cuando un PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la lista permitida, al tiempo que preserva superficies intencionales de plugins dinámicos, generadas, de compilación, live-test y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado objetivo desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El flujo de trabajo crea un token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro líneas:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

La línea `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando existan. Evita intencionalmente reenviar todo el cuerpo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del OpenClaw Gateway para el agente de ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente de ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Las aperturas rutinarias, ediciones, rotación de bots, ruido duplicado de Webhook y tráfico normal de revisiones deben dar como resultado `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisiones, nombres de ramas y mensajes de commits de GitHub como datos no confiables en toda esta ruta. Son entrada para resumen y triaje, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todos los carriles con alcance que no sean Android: shards de Linux Node, shards de Plugin incluidos, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Python Skills, Windows, macOS y Control UI i18n. Las ejecuciones manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas de release completo habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de Plugin, el shard `agentic-plugins` exclusivo de release, el barrido por lotes completo de extensiones y los carriles Docker de prerelease de Plugin se excluyen de CI. La suite Docker de prerelease solo se ejecuta cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de release no sea cancelada por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite a un llamador de confianza ejecutar ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de flujo de trabajo de la ref de despacho seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/paquetes incluidos, comprobaciones de contrato de canal en shards, shards de `check` excepto lint, shards y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Python Skills, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensión de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de pruebas de Linux Node, shards de pruebas de Plugin incluidos, `android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costó más de lo que ahorró)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento de producto/runtime. Se ejecuta a diario en `main` y se puede despachar manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente mide la ref del flujo de trabajo. Define `target_ref` para medir una etiqueta de release u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros latest se indexan por la ref probada, y cada `index.md` registra la ref/SHA probado, la ref/SHA del flujo de trabajo, la ref de Kova, el perfil, el modo de autenticación de carril, el modelo, el recuento de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde un release fijado y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y después ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfiles de CPU/heap/traza para puntos calientes de arranque, Gateway y turno de agente.
- `live-gpt54`: un turno de agente real de OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondeos de origen nativos de OpenClaw después del pase de Kova: tiempo de arranque y memoria del Gateway en casos de arranque predeterminado, hook y con 50 Plugin; bucles repetidos de saludo mock-OpenAI `channel-chat-baseline`; y comandos de arranque de CLI contra el Gateway arrancado. El resumen Markdown del sondeo de origen vive en `source/index.md` dentro del paquete de informe, con el JSON sin procesar junto a él.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondeo de origen en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la ref probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de release

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes del release". Acepta una rama, etiqueta o SHA de commit completo, despacha el flujo de trabajo manual `CI` con ese destino, despacha `Plugin Prerelease` para pruebas exclusivas de release de Plugin/paquete/estáticas/Docker, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, suites de ruta de release Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de release. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo carril de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación completa de release](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de flujo de trabajo, las diferencias de perfil, los artefactos y
los identificadores de reejecución enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de release. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de release y después de que
el preflight de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos los paquetes de Plugin publicables, despacha
`Plugin ClawHub Release` para el mismo SHA de release, y solo entonces despacha
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para prueba de commit fijado en una rama que se mueve rápido, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de despacho de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
helper empuja una rama temporal `release-ci/<sha>-...` en el SHA destino,
despacha `Full Release Validation` desde esa ref fijada, verifica que cada
`headSha` de flujo de trabajo hijo coincida con el destino y elimina la rama temporal cuando la
ejecución termina. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud de live/proveedor que se pasa a las comprobaciones de lanzamiento. Los
flujos de trabajo manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia consultiva de proveedores/medios.

- `minimum` conserva las lanes críticas de lanzamiento de OpenAI/core más rápidas.
- `stable` agrega el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de ejecución secundarios despachados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones secundarias y agrega tablas de trabajos más lentos para cada ejecución secundaria. Si un flujo de trabajo secundario se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado del paraguas y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prelanzamiento de plugin, `release-checks` para cada hijo de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada una repetición de ejecución de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la ref de flujo de trabajo de confianza para resolver la ref seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al flujo de trabajo Docker de ruta de lanzamiento live/E2E como al shard de aceptación de paquetes. Eso mantiene los bytes del paquete coherentes entre cajas de lanzamiento y evita volver a empaquetar el mismo candidato en múltiples trabajos secundarios.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo secundario que
ya haya despachado cuando se cancela el padre, de modo que la validación más nueva de main
no quede detrás de una ejecución obsoleta de dos horas de comprobaciones de lanzamiento. La validación
de ramas/etiquetas de lanzamiento y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

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
- shards separados de audio/video de medios y shards de música filtrados por proveedor

Eso conserva la misma cobertura de archivos y a la vez facilita repetir y diagnosticar fallos lentos de proveedores live. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola vez.

Los shards nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners Blacksmith normales: los trabajos de contenedor no son el lugar correcto para lanzar pruebas Docker anidadas.

Los shards de modelos/backends live respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El flujo de trabajo live de lanzamiento crea y publica esa imagen una vez, y luego los shards de modelo live Docker, Gateway segmentado por proveedor, backend CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del trabajo del flujo de trabajo, de modo que un contenedor bloqueado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de comprobaciones de lanzamiento. Si esos shards reconstruyen de forma independiente el objetivo Docker completo de código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un solo tarball mediante el mismo arnés Docker E2E que ejercitan los usuarios después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test`, e imprime la fuente, la ref de flujo de trabajo, la ref del paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest de paquete cuando hace falta, y ejecuta las lanes Docker seleccionadas contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esas lanes como trabajos Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el despacho independiente de Telegram aún puede instalar una especificación npm publicada.
4. `summary` falla el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o la lane opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para aceptación de prelanzamientos/estables publicados.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de commit de `package_ref` de confianza. El resolvedor recupera ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit fuente que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits fuente antiguos de confianza sin ejecutar lógica antigua de flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactas; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura offline de plugins para que la validación del paquete publicado no dependa de la disponibilidad live de ClawHub. La lane opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para despachos independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
lanes Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, actualización, limpieza de dependencias obsoletas de plugins, reparación de instalación de plugins configurados, plugin offline, actualización de plugins y prueba de Telegram sobre el mismo tarball de paquete resuelto. Configura `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm enviado en lugar del artefacto creado desde SHA. Las comprobaciones de lanzamiento cross-OS aún cubren incorporación, instalador y comportamiento de plataforma específicos de OS; la validación de producto de paquete/actualización debería comenzar con Package Acceptance. La lane Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de repetición de lanes fallidas conservan esa línea base. Configura `published_upgrade_survivor_baselines=all-since-2026.4.23` para ampliar la CI de Full Release a cada lanzamiento npm estable desde `2026.4.23` hasta `latest`; `release-history` sigue disponible para muestreo manual más amplio con el ancla anterior previa a esa fecha. Configura `published_upgrade_survivor_scenarios=reported-issues` para ampliar las mismas líneas base por fixtures con forma de incidencia para configuración de Feishu, archivos de bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de logs con tilde y raíces obsoletas de dependencias de plugins heredados. El flujo de trabajo separado `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualización publicada, no la amplitud normal de CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar una sola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o configurar `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La lane publicada configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json`, y sondea `/healthz`, `/readyz`, además del estado RPC después de iniciar Gateway. Las lanes frescas empaquetadas e instalador de Windows también verifican que un paquete instalado pueda importar una anulación de browser-control desde una ruta absoluta Windows sin procesar. El smoke de turno de agente cross-OS de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está configurado; de lo contrario, `openai/gpt-5.4`, de modo que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas conocidas privadas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes desde el fixture fake git derivado del tarball y puede registrar `update.channel` persistido faltante;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar persistencia faltante de registros de instalación de marketplace;
- `plugin-update` puede permitir migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento de no reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben cumplir los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Luego inspecciona la ejecución secundaria `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de carriles, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los carriles exactos de Docker en lugar de volver a ejecutar la validación de lanzamiento completa.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura de smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios de paquetes/manifiestos de plugins incluidos, o superficies centrales de plugin/canal/gateway/Plugin SDK que ejercitan los jobs de smoke de Docker. Los cambios solo de origen en plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida construye una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes en espacio de trabajo compartido, ejecuta el e2e de red de Gateway de contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil acotado de Docker de plugins incluidos bajo un tiempo de espera agregado de comando de 240 segundos (cada ejecución de Docker de cada escenario se limita por separado).
- **Ruta completa** mantiene la instalación de paquete QR y la cobertura de Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de smoke de GHCR del Dockerfile raíz de SHA objetivo, luego ejecuta la instalación de paquete QR, smokes del Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E rápido de Docker de plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance cambiado solicitaría cobertura completa en un push, el flujo de trabajo conserva el smoke rápido de Docker y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento del proveedor de imagen de instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas de Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` preconstruye una imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como tarball de npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor básico de Node/Git para carriles de instalador/actualización/dependencia de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variable                               | Predeterminado | Propósito                                                                                       |
| -------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Recuento de ranuras del pool principal para carriles normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Recuento de ranuras del pool final sensible a proveedores.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de carriles en vivo concurrentes para que los proveedores no apliquen throttling.        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de carriles de instalación npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de carriles multiservicio concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de carriles para evitar ráfagas de creación del daemon de Docker; define `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Tiempo de espera de respaldo por carril (120 minutos); carriles en vivo/finales seleccionados usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset          | `1` imprime el plan del programador sin ejecutar carriles.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset          | Lista exacta de carriles separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede iniciarse desde un pool vacío, luego se ejecuta solo hasta que libera capacidad. Las precomprobaciones agregadas locales comprueban Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten el estado de carriles activos, persisten tiempos de carriles para ordenación de más largo primero y dejan de programar nuevos carriles en pool tras el primer fallo de forma predeterminada.

### Flujo de trabajo reutilizable en vivo/E2E

El flujo de trabajo reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y publica imágenes E2E de Docker GHCR básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas de Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de reconstruir. Los pulls de imágenes de Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un flujo de registro/caché bloqueado reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura de Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute múltiples carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos actuales de Docker de lanzamiento son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de reejecución manual para ambos carriles de instalador de proveedores.

OpenWebUI se incorpora en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carriles, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de carriles lentos y comandos de reejecución por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta carriles seleccionados contra las imágenes preparadas en lugar de los jobs de fragmentos, lo que mantiene la depuración de carriles fallidos acotada a un job de Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril de Docker en vivo, el job dirigido construye localmente la imagen de prueba en vivo para esa reejecución. Los comandos generados de reejecución de GitHub por carril incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando existen esos valores, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El flujo de trabajo programado en vivo/E2E ejecuta diariamente la suite completa de Docker de release-path.

## Prelanzamiento de plugins

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos en ocho workers de extensión; esos jobs de shards de extensión ejecutan hasta dos grupos de configuración de plugin a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen jobs de CI adicionales. La ruta de prelanzamiento de Docker exclusiva de lanzamiento agrupa carriles de Docker dirigidos en grupos pequeños para evitar reservar decenas de runners para jobs de uno a tres minutos.

## Laboratorio de QA

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal de alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no es un flujo de trabajo de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar a una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y por despacho manual; despliega el carril de paridad simulado, el carril Matrix en vivo y los carriles Telegram y Discord en vivo como jobs paralelos. Los jobs en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia del modelo en vivo y del inicio normal del plugin de proveedor. El Gateway de transporte en vivo desactiva la búsqueda en memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para gates programados y de lanzamiento, añadiendo `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; un despacho manual con `matrix_profile=all` siempre divide la cobertura completa de Matrix en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento de QA Lab antes de la aprobación del lanzamiento; su gate de paridad de QA ejecuta los paquetes candidato y de referencia como jobs de carriles paralelos, luego descarga ambos artefactos en un pequeño job de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobaciones acotadas en lugar de tratar la paridad como un estado requerido.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad inicial y acotado, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de solicitudes de incorporación de cambios que no estén en borrador analizan el código de los flujos de trabajo de Actions y las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas por `security-severity` alta/crítica.

La protección de solicitudes de incorporación de cambios se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. Android y macOS CodeQL quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Línea base de autenticación, secretos, sandbox, Cron y Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales centrales más el runtime del Plugin de canal, Gateway, SDK de Plugin, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies centrales de SSRF, análisis de IP, protección de red, obtención web y política SSRF del SDK de Plugin                   |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente              |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de código fuente y contrato de paquete del SDK de Plugin |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila la aplicación Android manualmente para CodeQL en el ejecutor Linux de Blacksmith más pequeño aceptado por la comprobación de sanidad del flujo de trabajo. Se sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Compila la aplicación macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y se sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el ejecutor Linux de Blacksmith más pequeño. Su protección de solicitudes de incorporación de cambios es intencionalmente más pequeña que el perfil programado: los PR que no están en borrador solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en ejecución de comandos/modelos/herramientas de agente y código de despacho de respuestas, esquema/migración/IO de configuración, autenticación/secretos/sandbox/código de seguridad, runtime de canales centrales y Plugins de canal incluidos, protocolo de Gateway/métodos de servidor, runtime de memoria/unión con SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de Plugins, SDK de Plugin/contrato de paquete, o runtime de respuestas del SDK de Plugin. Los cambios de configuración de CodeQL y de flujo de trabajo de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles acotados son ganchos de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, Cron y Gateway                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales centrales y Plugins de canal incluidos                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, auxiliares de supervisión de procesos y contratos de entrega saliente                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias de memoria del SDK de Plugin, unión de activación del runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesión, auxiliares de vinculación/entrega de sesión saliente, superficies de eventos de diagnóstico/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del SDK de Plugin, auxiliares de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y auxiliares de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/búsqueda/obtención/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la UI de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de obtención/búsqueda web central, IO de medios, comprensión de medios, generación de imágenes y generación de medios                         |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y puntos de entrada del SDK de Plugin                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del SDK de Plugin del lado del paquete y auxiliares de contrato de paquete de Plugin                                                       |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, desactivarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y Plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles acotados tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de docs

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex impulsada por eventos para mantener la documentación existente alineada con los cambios incorporados recientemente. No tiene una programación pura: una ejecución de CI exitosa de inserción no realizada por bots en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` ha avanzado o cuando otra ejecución no omitida de Docs Agent se creó en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA fuente del Docs Agent no omitido anterior hasta el `main` actual, por lo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de docs.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex impulsada por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de inserción no realizada por bots en `main` puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o está ejecutándose ese día UTC. El despacho manual omite esa puerta de actividad diaria. La vía crea un informe de rendimiento Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el recuento de pruebas aprobadas de la línea base. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de la suite completa posterior al agente debe aprobar antes de que se confirme cualquier cosa. Cuando `main` avanza antes de que la inserción del bot aterrice, la vía rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta la inserción; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de docs.

### PR duplicados después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenedor para limpieza de duplicados posterior al aterrizaje. Su valor predeterminado es simulación y solo cierra PR listados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga una incidencia referenciada compartida o fragmentos modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación local y enrutamiento de cambios

La lógica local de vías modificadas vive en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta con los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del core ejecutan verificación de tipos de prod del core y pruebas del core, además de lint/protecciones del core;
- los cambios solo de pruebas del core ejecutan solo verificación de tipos de pruebas del core, además de lint del core;
- los cambios de producción de extensiones ejecutan verificación de tipos de prod de extensiones y pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan verificación de tipos de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del SDK de Plugin o del contrato de Plugin se expanden a verificación de tipos de extensiones porque las extensiones dependen de esos contratos centrales (los barridos Vitest de extensiones siguen siendo trabajo de pruebas explícito);
- los aumentos de versión solo de metadatos de release ejecutan comprobaciones específicas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega en salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuestas visibles en grupo, el modo de entrega de respuestas de origen o el prompt de sistema de la herramienta de mensajes pasan por las pruebas de respuestas del core más regresiones de entrega de Discord y Slack para que un cambio predeterminado compartido falle antes del primer push del PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una instancia preparada nueva para pruebas amplias. Antes de gastar una verificación lenta en una instancia reutilizada, caducada o que acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la instancia.

La comprobación de sanidad falla rápido cuando desaparecen archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones con seguimiento. Eso normalmente significa que el estado de sincronización remota no es una copia confiable del PR; detén esa instancia y prepara una nueva en lugar de depurar el fallo de la prueba del producto. Para PRs con eliminaciones grandes intencionales, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de sanidad.

`pnpm testbox:run` también termina una invocación local de Blacksmith CLI que permanezca en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es la segunda ruta de instancia remota propiedad del repositorio para pruebas en Linux cuando Blacksmith no está disponible o cuando es preferible usar capacidad cloud propia. Prepara una instancia, hidrátala mediante el flujo de trabajo del proyecto y luego ejecuta comandos con la Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos remotos de Git en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/compilación que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia de entorno no secreto que después cargan los comandos `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
