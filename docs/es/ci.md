---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-30T18:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El job `preflight` clasifica el diff y desactiva lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan todo el grafo para candidatos de release y validación amplia. Las lanes de Android siguen siendo opt-in mediante `include_android`. La cobertura de plugins solo para release vive en el workflow separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o un despacho manual explícito.

## Resumen del pipeline

| Job                              | Propósito                                                                                    | Cuándo se ejecuta                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Detectar cambios solo de docs, scopes cambiados, extensiones cambiadas y crear el manifiesto de CI | Siempre en pushes y PRs no draft |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                      | Siempre en pushes y PRs no draft |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra advisories de npm               | Siempre en pushes y PRs no draft |
| `security-fast`                  | Agregado requerido para los jobs rápidos de seguridad                                        | Siempre en pushes y PRs no draft |
| `check-dependencies`             | Pase de Knip solo de dependencias de producción más el guard de allowlist de archivos no usados | Cambios relevantes para Node     |
| `build-artifacts`                | Compilar `dist/`, Control UI, checks de artefactos compilados y artefactos downstream reutilizables | Cambios relevantes para Node     |
| `checks-fast-core`               | Lanes rápidas de corrección en Linux, como checks de bundled/plugin-contract/protocol         | Cambios relevantes para Node      |
| `checks-fast-contracts-channels` | Checks shardeados de contratos de canales con un resultado agregado estable                  | Cambios relevantes para Node      |
| `checks-node-core-test`          | Shards de tests core de Node, excluyendo lanes de canales, bundled, contratos y extensiones  | Cambios relevantes para Node      |
| `check`                          | Equivalente shardeado del gate local principal: tipos prod, lint, guards, tipos de test y smoke estricto | Cambios relevantes para Node      |
| `check-additional`               | Shards de arquitectura, boundaries, guards de superficie de extensiones, package-boundary y gateway-watch | Cambios relevantes para Node      |
| `build-smoke`                    | Tests smoke de CLI compilada y smoke de memoria de arranque                                  | Cambios relevantes para Node      |
| `checks`                         | Verificador para tests de canales con artefactos compilados                                  | Cambios relevantes para Node      |
| `checks-node-compat-node22`      | Lane de build y smoke de compatibilidad con Node 22                                          | Despacho manual de CI para releases |
| `check-docs`                     | Formato, lint y checks de enlaces rotos de docs                                              | Docs cambiadas                    |
| `skills-python`                  | Ruff + pytest para skills respaldadas por Python                                             | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Tests específicos de Windows para procesos/rutas más regresiones compartidas de especificadores de import de runtime | Cambios relevantes para Windows   |
| `macos-node`                     | Lane de tests TypeScript de macOS usando los artefactos compilados compartidos               | Cambios relevantes para macOS     |
| `macos-swift`                    | Lint, build y tests de Swift para la app de macOS                                            | Cambios relevantes para macOS     |
| `android`                        | Tests unitarios de Android para ambos flavors más una build de APK debug                     | Cambios relevantes para Android   |
| `test-performance-agent`         | Optimización diaria de tests lentos de Codex después de actividad confiable                  | Éxito de CI principal o despacho manual |

## Orden fail-fast

1. `preflight` decide qué lanes existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los jobs más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con las lanes rápidas de Linux para que los consumidores downstream puedan empezar en cuanto la build compartida esté lista.
4. Las lanes más pesadas de plataformas y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más nueva para el mismo ref también esté fallando. Los checks agregados de shards usan `!cancelled() && always()` para que sigan informando fallos normales de shards, pero no se pongan en cola después de que todo el workflow ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por tests unitarios en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si todas las áreas con scope hubieran cambiado.

- **Las ediciones del workflow de CI** validan el grafo de CI de Node más linting de workflows, pero por sí solas no fuerzan builds nativas de Windows, Android ni macOS; esas lanes de plataforma siguen estando limitadas a cambios en el código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratos de core-test y ediciones estrechas de helpers/test-routing de contratos de plugins** usan una ruta rápida de manifiesto solo Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, shards core completos, shards de plugins bundled y matrices de guards adicionales cuando el cambio está limitado a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Los checks de Node en Windows** están limitados a wrappers específicos de Windows para procesos/rutas, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies del workflow de CI que ejecutan esa lane; los cambios no relacionados de código fuente, plugins, install-smoke y solo tests permanecen en las lanes de Node en Linux.

Las familias de tests de Node más lentas se dividen o equilibran para que cada job se mantenga pequeño sin sobrerreservar runners: los contratos de canales se ejecutan como tres shards ponderados, las lanes pequeñas de unidades core se emparejan, auto-reply se ejecuta como cuatro workers equilibrados (con el subárbol de reply dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/plugin se reparten entre los jobs agentic de Node existentes solo de código fuente en vez de esperar a artefactos compilados. Los tests amplios de navegador, QA, media y plugins varios usan sus configuraciones dedicadas de Vitest en vez del catch-all compartido de plugins. Los shards de include-pattern registran entradas de tiempos usando el nombre del shard de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de package-boundary y separa la arquitectura de topología de runtime de la cobertura de gateway watch; el shard de guard de boundary ejecuta sus pequeños guards independientes de forma concurrente dentro de un solo job. Gateway watch, los tests de canales y el shard core support-boundary se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y después compila el APK debug de Play. El flavor third-party no tiene source set ni manifest separados; su lane de tests unitarios sigue compilando el flavor con las flags BuildConfig de SMS/call-log, mientras evita un job duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip solo de dependencias de producción fijado a la versión más reciente de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación con `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción no usados de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos no usados falla cuando un PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la allowlist, preservando a la vez superficies intencionales de plugins dinámicos, generadas, de build, live-test y puentes de paquetes que Knip no puede resolver estáticamente.

## Despachos manuales

Los despachos manuales de CI ejecutan el mismo grafo de jobs que CI normal, pero fuerzan todas las lanes con scope no Android: shards de Node en Linux, shards de plugins bundled, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, build smoke, checks de docs, Skills de Python, Windows, macOS y la i18n de Control UI. Los despachos manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas de release completa habilita Android pasando `include_android=true`. Los checks estáticos de prerelease de plugins, el shard `agentic-plugins` solo para release, el barrido completo por lotes de extensiones y las lanes Docker de prerelease de plugins se excluyen de CI. La suite Docker de prerelease solo se ejecuta cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con el gate de release-validation habilitado.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de release no sea cancelada por otro push o ejecución de PR en el mismo ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, tag o SHA de commit completo mientras usa el archivo de workflow del ref de despacho seleccionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos de seguridad rápidos y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidas, comprobaciones de contrato de canales fragmentadas, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de docs, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Node en Linux, fragmentos de pruebas de Plugin incluidos, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a la CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el coste de tiempo de cola de 32 vCPU fue mayor que lo que ahorró)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
```

## Validación completa de lanzamiento

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes del lanzamiento". Acepta una rama, etiqueta o SHA de commit completo, despacha el flujo de trabajo manual `CI` con ese destino, despacha `Plugin Prerelease` para pruebas exclusivas de lanzamiento de Plugin/paquete/estático/Docker, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, suites de ruta de lanzamiento de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. También puede ejecutar el flujo de trabajo posterior a la publicación `NPM Telegram Beta E2E` cuando se proporciona una especificación de paquete publicada.

`release_profile` controla la amplitud live/proveedor que se pasa a las comprobaciones de lanzamiento:

- `minimum` conserva los carriles OpenAI/core críticos para el lanzamiento más rápidos.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia de proveedores/medios de asesoramiento.

El paraguas registra los ids de las ejecuciones hijas despachadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de los trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado del paraguas y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para una candidata de lanzamiento, `ci` solo para el hijo de CI completo normal, `release-checks` para cada hijo de lanzamiento, o un grupo más limitado: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la ref de flujo de trabajo de confianza para resolver la ref seleccionada una sola vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al flujo de trabajo Docker live/E2E de ruta de lanzamiento como al fragmento de aceptación de paquetes. Eso mantiene los bytes del paquete consistentes entre cajas de lanzamiento y evita volver a empaquetar la misma candidata en varios trabajos hijos.

## Fragmentos live y E2E

El hijo live/E2E de lanzamiento conserva la cobertura amplia nativa de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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

Eso mantiene la misma cobertura de archivos mientras hace que las fallas lentas de proveedores live sean más fáciles de volver a ejecutar y diagnosticar. Los nombres de fragmentos agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola vez.

Los fragmentos nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en ejecutores Blacksmith normales: los trabajos en contenedores no son el lugar correcto para lanzar pruebas Docker anidadas.

Los fragmentos live de modelo/backend respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El flujo de trabajo live de lanzamiento construye y sube esa imagen una vez, luego los fragmentos de modelo live Docker, Gateway, backend de CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Si esos fragmentos reconstruyen el destino Docker completo del código fuente de forma independiente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?" Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés Docker E2E que usan los usuarios después de instalar o actualizar.

### Trabajos

1. `resolve_package` clona `workflow_ref`, resuelve una candidata de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime la fuente, la ref del flujo de trabajo, la ref del paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker de resumen de paquete cuando es necesario y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego despliega esos carriles como trabajos Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el despacho independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` falla el flujo de trabajo si la resolución del paquete, la aceptación Docker o el carril opcional de Telegram fallaron.

### Fuentes de candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw, como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de versiones beta/estables publicadas.
- `source=ref` empaqueta una rama, etiqueta o SHA de confirmación completo de `package_ref` de confianza. El resolutor obtiene ramas/etiquetas de OpenClaw, verifica que la confirmación seleccionada sea alcanzable desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala dependencias en un árbol de trabajo desacoplado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es la confirmación de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide confirmaciones de origen antiguas de confianza sin ejecutar lógica antigua de flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación del paquete publicado no dependa de la disponibilidad en vivo de ClawHub. La línea opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada mantenida para despachos independientes.

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` y `telegram_mode=mock-openai`. Los fragmentos Docker de la ruta de lanzamiento cubren las líneas superpuestas de paquete/actualización/plugin; Package Acceptance mantiene la prueba nativa de artefacto de compatibilidad de canales incluidos, plugin sin conexión y Telegram contra el mismo tarball de paquete resuelto. Las comprobaciones de lanzamiento entre sistemas operativos siguen cubriendo incorporación, instalador y comportamiento de plataforma específicos de cada sistema operativo; la validación de producto de paquete/actualización debería empezar con Package Acceptance. Las líneas frescas de paquete e instalador de Windows también verifican que un paquete instalado pueda importar una anulación de control del navegador desde una ruta absoluta sin procesar de Windows. La prueba smoke de turno de agente entre sistemas operativos de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.4-mini`, para que la prueba de instalación y Gateway sea rápida y determinista.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas de QA conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia de `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- las pruebas smoke de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento de no reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se distribuyeron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquete, empieza por el resumen de `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución secundaria `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de líneas, tiempos de fases y comandos de repetición. Prefiere volver a ejecutar el perfil de paquete fallido o las líneas Docker exactas en lugar de repetir la validación completa de lanzamiento.

## Prueba smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para solicitudes de extracción que tocan superficies Docker/paquete, cambios de paquete/manifiesto de plugins incluidos, o superficies centrales de plugin/canal/Gateway/SDK de Plugin que ejercitan los trabajos smoke de Docker. Los cambios de solo código fuente en plugins incluidos, ediciones solo de pruebas y ediciones solo de documentación no reservan workers Docker. La ruta rápida compila una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta la prueba smoke de CLI de eliminación de agentes en el espacio de trabajo compartido, ejecuta el e2e de gateway-network en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de plugins incluidos con un tiempo de espera agregado de comando de 240 segundos (cada ejecución Docker de escenario limitada por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento por workflow-call y solicitudes de extracción que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke GHCR del Dockerfile raíz del SHA objetivo, luego ejecuta instalación de paquete QR, pruebas smoke de Dockerfile raíz/Gateway, pruebas smoke de instalador/actualización y el E2E Docker rápido de plugins incluidos como trabajos separados para que el trabajo del instalador no espere detrás de las pruebas smoke de la imagen raíz.

Los pushes a `main` (incluidas confirmaciones de merge) no fuerzan la ruta completa; cuando la lógica de alcance cambiado solicitaría cobertura completa en un push, el flujo de trabajo mantiene la prueba smoke rápida de Docker y deja la prueba smoke completa de instalación para la validación nocturna o de lanzamiento.

La prueba smoke lenta de proveedor de imagen de instalación global de Bun está controlada por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirla, pero las solicitudes de extracción y los pushes a `main` no. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E Docker local

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor Node/Git básico para líneas de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para líneas de funcionalidad normal.

Las definiciones de líneas Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por línea con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta líneas con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                       |
| -------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Cantidad de ranuras del grupo principal para líneas normales.                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Cantidad de ranuras del grupo final sensible a proveedores.                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de líneas en vivo concurrentes para que los proveedores no limiten la tasa.              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de líneas concurrentes de instalación npm.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de líneas concurrentes multiservicio.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de líneas para evitar tormentas de creación del daemon de Docker; define `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Tiempo de espera de reserva por línea (120 minutos); líneas en vivo/final seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset          | `1` imprime el plan del programador sin ejecutar líneas.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset          | Lista exacta de líneas separadas por comas; omite la limpieza smoke para que los agentes puedan reproducir una línea fallida. |

Una línea más pesada que su límite efectivo aún puede iniciar desde un grupo vacío, luego se ejecuta sola hasta que libera capacidad. El agregado local ejecuta preflights de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de líneas activas, persiste tiempos de líneas para ordenarlas primero por las más largas y deja de programar nuevas líneas agrupadas tras el primer fallo de forma predeterminada.

### Flujo de trabajo live/E2E reutilizable

El flujo de trabajo live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, línea y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes GHCR Docker E2E básicas/funcionales etiquetadas con el digest del paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita líneas con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las descargas de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un flujo de registro/caché atascado reintente rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute varias líneas mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Los fragmentos de Docker de la versión actual son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hasta `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` y `bundled-channels-contracts`. El fragmento agregado `bundled-channels` sigue disponible para repeticiones manuales únicas, y `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles de instalador de proveedores. El fragmento `bundled-channels` ejecuta carriles divididos `bundled-channel-*` y `bundled-channel-update-*` en lugar del carril serial todo en uno `bundled-channel-deps`.

OpenWebUI se incorpora en `plugins-runtime-services` cuando la cobertura completa de la ruta de publicación lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento carga `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del planificador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmento, lo que mantiene la depuración de carriles fallidos acotada a un trabajo de Docker específico y prepara, descarga o reutiliza el artefacto del paquete para esa ejecución; si un carril seleccionado es un carril de Docker en vivo, el trabajo específico compila localmente la imagen de pruebas en vivo para esa repetición. Los comandos generados de repetición de GitHub por carril incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # descargar artefactos de Docker e imprimir comandos de repetición combinados/por carril específicos
pnpm test:docker:timings <summary>   # resúmenes de carriles lentos y ruta crítica de fases
```

El flujo de trabajo programado de pruebas en vivo/E2E ejecuta a diario la suite completa de Docker de la ruta de publicación.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Las solicitudes de incorporación normales, los envíos a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugin incluidos entre ocho workers de extensiones; esos trabajos de fragmento de extensiones ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugin con muchas importaciones no creen trabajos de CI adicionales.

## QA Lab

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente.

- El flujo de trabajo `Parity gate` se ejecuta en cambios de PR coincidentes y en despacho manual; compila el runtime privado de QA y compara los paquetes agénticos simulados de GPT-5.5 y Opus 4.6.
- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante despacho manual; distribuye como trabajos paralelos la puerta de paridad simulada, el carril Matrix en vivo y los carriles Telegram y Discord en vivo. Los trabajos en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan arrendamientos de Convex.

Las comprobaciones de versión ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados para simulación (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia del modelo en vivo y del arranque normal del Plugin de proveedor. El Gateway de transporte en vivo deshabilita la búsqueda en memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de versión, y agrega `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de QA Lab antes de la aprobación de la versión; su puerta de paridad de QA ejecuta los paquetes candidato y base como trabajos de carril paralelos, luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

No pongas la ruta de aterrizaje del PR detrás de `Parity gate` a menos que el cambio toque realmente el runtime de QA, la paridad de paquetes de modelos o una superficie propiedad del flujo de trabajo de paridad. Para correcciones normales de canales, configuración, documentación o pruebas unitarias, trátalo como una señal opcional y sigue la evidencia de CI/comprobaciones con alcance.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de solicitudes de incorporación no borrador escanean el código de flujos de trabajo de Actions más las superficies de JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de solicitudes de incorporación se mantiene ligera: solo empieza para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL de Android y macOS quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secretos, sandbox, Cron y línea base de Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales principales más runtime de Plugin de canal, Gateway, Plugin SDK, secretos, puntos de auditoría  |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies centrales de SSRF, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agentes                   |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, preparación de dependencias de runtime, carga de fuentes y contrato de paquete de Plugin SDK |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila manualmente la app de Android para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la cordura del flujo de trabajo. Carga bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Compila manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra de los SARIF cargados los resultados de compilación de dependencias y carga bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript no relacionadas con seguridad y de severidad de error sobre superficies estrechas de alto valor en el runner Blacksmith Linux más pequeño. Su protección de solicitudes de incorporación es intencionalmente menor que el perfil programado: los PR no borrador solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de auth/secretos/sandbox/seguridad, runtime de canales principales y Plugin de canales incluidos, método de servidor/protocolo de Gateway, pegamento de runtime/SDK de memoria, MCP/proceso/entrega saliente, catálogo de runtime/modelos de proveedor, diagnósticos de sesión/colas de entrega, cargador de Plugin, contrato de paquete/Plugin SDK o runtime de respuestas de Plugin SDK. Los cambios de configuración de CodeQL y de flujo de trabajo de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, cron y gateway                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de E/S                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos del servidor                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal principal y del plugin de canal incluido                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control de ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, ayudantes de supervisión de procesos y contratos de entrega saliente                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias del SDK de Plugin de memoria, unión de activación del runtime de memoria y comandos de doctor de memoria        |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de la cola de respuestas, colas de entrega de sesión, ayudantes de vinculación/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de registros y contratos de la CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del SDK de Plugin, ayudantes de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y ayudantes de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/búsqueda/obtención/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la interfaz de control, persistencia local, flujos de control de gateway y contratos de runtime del plano de control de tareas                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de obtención/búsqueda web principal, E/S multimedia, comprensión multimedia, generación de imágenes y generación multimedia                               |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y puntos de entrada del SDK de Plugin                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente del SDK de Plugin del lado del paquete publicado y ayudantes de contrato de paquete de plugin                                                                           |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex orientado por eventos para mantener la documentación existente alineada con los cambios integrados recientemente. No tiene una programación pura: una ejecución correcta de CI de un push que no sea de bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` avanzó o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, por lo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex orientado por eventos para pruebas lentas. No tiene una programación pura: una ejecución correcta de CI de un push que no sea de bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o está en ejecución ese día UTC. El despacho manual omite esa puerta de actividad diaria. El carril crea un informe de rendimiento de Vitest agrupado para toda la suite, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de toda la suite y rechaza los cambios que reduzcan el recuento base de pruebas aprobadas. Si la base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de toda la suite posterior al agente debe aprobar antes de que se confirme cualquier cosa. Cuando `main` avanza antes de que aterrice el push del bot, el carril rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicadas después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenedor para limpieza de duplicados posterior al aterrizaje. De forma predeterminada es una simulación y solo cierra las PR listadas explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que la PR aterrizada esté fusionada y que cada duplicada tenga un issue referenciado compartido o hunks cambiados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de verificación local y enrutamiento de cambios

La lógica local de carriles cambiados vive en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Esa puerta de verificación local es más estricta sobre los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan verificación de tipos de producción del núcleo y de pruebas del núcleo, además de lint/guardias del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo verificación de tipos de pruebas del núcleo, además de lint del núcleo;
- los cambios de producción de extensiones ejecutan verificación de tipos de producción de extensiones y de pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan verificación de tipos de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del SDK de Plugin o de contrato de plugin se expanden a verificación de tipos de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los aumentos de versión solo de metadatos de versión ejecutan verificaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de verificación.

El enrutamiento local de pruebas cambiadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren asignaciones explícitas, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible de grupo, el modo de entrega de respuesta de origen o el prompt del sistema de la herramienta de mensajes pasan por las pruebas principales de respuesta más regresiones de entrega de Discord y Slack para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto barato asignado no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja recién calentada para pruebas amplias. Antes de gastar una puerta lenta en una caja que fue reutilizada, expiró o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La verificación de cordura falla rápido cuando archivos raíz requeridos como `pnpm-lock.yaml` desaparecieron o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remoto no es una copia confiable de la PR; detén esa caja y calienta una nueva en lugar de depurar el fallo de prueba del producto. Para PR intencionales con muchas eliminaciones, establece `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para deshabilitar esa guardia, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
