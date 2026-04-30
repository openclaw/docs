---
read_when:
    - Debe entender por qué un trabajo de CI se ejecutó o no
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o reejecución de validación de lanzamiento
summary: Grafo de trabajos de CI, puertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-30T09:34:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva las lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan todo el grafo para release candidates y validación amplia. Las lanes de Android siguen siendo opt-in mediante `include_android`. La cobertura de plugins solo para lanzamientos vive en el flujo de trabajo independiente [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de la versión`](#full-release-validation) o una ejecución manual explícita.

## Resumen del pipeline

| Trabajo                          | Propósito                                                                                    | Cuándo se ejecuta                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar cambios solo de docs, ámbitos modificados, extensiones modificadas y crear el manifiesto de CI | Siempre en pushes y PRs que no sean borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                      | Siempre en pushes y PRs que no sean borrador |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                   | Siempre en pushes y PRs que no sean borrador |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                    | Siempre en pushes y PRs que no sean borrador |
| `check-dependencies`             | Paso de Knip solo para dependencias de producción más el guard de la lista de permitidos de archivos no usados | Cambios relevantes para Node       |
| `build-artifacts`                | Compilar `dist/`, Control UI, comprobaciones de artefactos compilados y artefactos reutilizables para trabajos descendentes | Cambios relevantes para Node       |
| `checks-fast-core`               | Lanes rápidas de corrección en Linux, como comprobaciones de bundled/plugin-contract/protocol | Cambios relevantes para Node       |
| `checks-fast-contracts-channels` | Comprobaciones de contratos de canal fragmentadas con un resultado de comprobación agregado estable | Cambios relevantes para Node       |
| `checks-node-core-test`          | Fragmentos de tests de Node del núcleo, excluidas las lanes de canal, bundled, contrato y extensión | Cambios relevantes para Node       |
| `check`                          | Equivalente fragmentado de la gate local principal: tipos de producción, lint, guards, tipos de tests y smoke estricto | Cambios relevantes para Node       |
| `check-additional`               | Fragmentos de arquitectura, límites, guards de superficie de extensión, package-boundary y gateway-watch | Cambios relevantes para Node       |
| `build-smoke`                    | Tests smoke de la CLI compilada y smoke de memoria de arranque                              | Cambios relevantes para Node       |
| `checks`                         | Verificador para tests de canales con artefactos compilados                                  | Cambios relevantes para Node       |
| `checks-node-compat-node22`      | Lane de compilación y smoke de compatibilidad con Node 22                                    | Ejecución manual de CI para lanzamientos |
| `check-docs`                     | Formateo, lint y comprobaciones de enlaces rotos de la documentación                         | Cambios en docs                    |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                             | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Tests específicos de Windows de procesos/rutas más regresiones compartidas de especificadores de importación en runtime | Cambios relevantes para Windows    |
| `macos-node`                     | Lane de tests TypeScript en macOS usando los artefactos compilados compartidos                | Cambios relevantes para macOS      |
| `macos-swift`                    | Lint, compilación y tests de Swift para la app de macOS                                      | Cambios relevantes para macOS      |
| `android`                        | Tests unitarios de Android para ambos sabores más una compilación de APK de depuración        | Cambios relevantes para Android    |
| `test-performance-agent`         | Optimización diaria de tests lentos de Codex después de actividad confiable                  | Éxito de CI en main o ejecución manual |

## Orden fail-fast

1. `preflight` decide qué lanes existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con las lanes rápidas de Linux para que los consumidores descendentes puedan empezar en cuanto la compilación compartida esté lista.
4. Las lanes más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para seguir informando fallos normales de fragmentos, pero no se ponen en cola después de que todo el workflow ya haya sido reemplazado. La clave de concurrencia automática de CI está versionada (`CI-v7-*`), de modo que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por tests unitarios en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Las ediciones del workflow de CI** validan el grafo de CI de Node más el linting de workflows, pero no fuerzan por sí mismas compilaciones nativas de Windows, Android o macOS; esas lanes de plataforma siguen estando acotadas a cambios de código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas baratas de fixtures de core-test y ediciones estrechas de helper/enrutamiento de tests de contratos de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canal, fragmentos completos del núcleo, fragmentos de plugins bundled y matrices adicionales de guards cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** están acotadas a wrappers de procesos/rutas específicos de Windows, helpers de runners de npm/pnpm/UI, configuración del gestor de paquetes y las superficies del workflow de CI que ejecutan esa lane; los cambios no relacionados de código fuente, plugins, install-smoke y solo de tests permanecen en las lanes de Node en Linux.

Las familias de tests de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar runners en exceso: los contratos de canal se ejecutan como tres fragmentos ponderados, las lanes pequeñas de unidades del núcleo se emparejan, auto-reply se ejecuta como cuatro workers equilibrados (con el subárbol de reply dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agénticas de gateway/plugins se distribuyen entre los trabajos agénticos de Node solo de código fuente existentes en lugar de esperar a artefactos compilados. Los tests amplios de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos con patrones de inclusión registran entradas de tiempo usando el nombre del fragmento de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene juntos el trabajo de compilación/canary de package-boundary y separa la arquitectura de topología de runtime de la cobertura de gateway watch; el fragmento de boundary guard ejecuta sus pequeños guards independientes de forma concurrente dentro de un solo trabajo. Gateway watch, los tests de canales y el fragmento de support-boundary del núcleo se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK de depuración de Play. El sabor de terceros no tiene un conjunto de código fuente ni manifiesto separado; su lane de tests unitarios sigue compilando el sabor con las flags BuildConfig de SMS/call-log, evitando al mismo tiempo un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un paso de Knip solo para dependencias de producción fijado a la versión más reciente de Knip, con la edad mínima de publicación de pnpm desactivada para la instalación con `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos no usados de producción de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos no usados falla cuando un PR añade un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la lista de permitidos, a la vez que preserva superficies intencionales de plugins dinámicos, generadas, de compilación, live-test y puentes de paquetes que Knip no puede resolver estáticamente.

## Ejecuciones manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de cada lane con alcance que no sea Android: fragmentos de Node en Linux, fragmentos de plugins bundled, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de docs, Skills de Python, Windows, macOS e i18n de Control UI. Las ejecuciones manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas de lanzamiento completo habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prelanzamiento de plugins, el fragmento `agentic-plugins` solo para lanzamientos, el barrido completo por lotes de extensiones y las lanes de Docker de prelanzamiento de plugins quedan excluidos de CI. La suite de prelanzamiento de Docker solo se ejecuta cuando `Full Release Validation` despacha el workflow independiente `Plugin Prerelease` con la gate de validación de lanzamiento habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de release candidate no sea cancelada por otro push o ejecución de PR en el mismo ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de workflow del ref de despacho seleccionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos y agregados de seguridad rápidos (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidas, comprobaciones fragmentadas de contratos de canales, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; la preflight de install-smoke también usa Ubuntu alojado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de menor peso de extensiones, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Node en Linux, fragmentos de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a la CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                                                                                                     |
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

## Validación completa de la versión

`Full Release Validation` es el flujo de trabajo manual general para "ejecutar todo antes del lanzamiento". Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para pruebas exclusivas de lanzamiento de plugins/paquetes/estáticas/Docker, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, suites de ruta de lanzamiento de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. También puede ejecutar el flujo de trabajo posterior a la publicación `NPM Telegram Beta E2E` cuando se proporciona una especificación de paquete publicada.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de lanzamiento:

- `minimum` mantiene los carriles más rápidos críticos para el lanzamiento de OpenAI/núcleo.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El flujo general registra los identificadores de las ejecuciones secundarias despachadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones secundarias y anexa tablas de los trabajos más lentos para cada ejecución secundaria. Si un flujo de trabajo secundario se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador principal para actualizar el resultado general y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el secundario de CI completo normal, `release-checks` para cada secundario de lanzamiento, o un grupo más específico: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el flujo general. Esto mantiene acotada una nueva ejecución de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al flujo de trabajo Docker live/E2E de ruta de lanzamiento como al fragmento de aceptación de paquetes. Eso mantiene coherentes los bytes del paquete entre cajas de lanzamiento y evita volver a empaquetar el mismo candidato en varios trabajos secundarios.

## Fragmentos live y E2E

El secundario live/E2E de lanzamiento mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en vez de un trabajo serial:

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
- fragmentos separados de audio/vídeo de medios y fragmentos de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos y a la vez hace que los fallos lentos de proveedores live sean más fáciles de volver a ejecutar y diagnosticar. Los nombres de fragmento agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para nuevas ejecuciones manuales únicas.

Los fragmentos nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en ejecutores Blacksmith normales: los trabajos de contenedor son el lugar incorrecto para lanzar pruebas Docker anidadas.

Los fragmentos live de modelo/backend respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El flujo de trabajo de lanzamiento live compila y sube esa imagen una vez, luego los fragmentos de modelo live Docker, Gateway, backend de CLI, enlace ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Si esos fragmentos recompilan de forma independiente el objetivo Docker completo del código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la referencia de flujo de trabajo, la referencia de paquete, la versión, SHA-256 y el perfil en el resumen de paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con resumen de paquete cuando hace falta, y ejecuta los carriles Docker seleccionados contra ese paquete en vez de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego despliega esos carriles como trabajos Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el despacho independiente de Telegram aún puede instalar una especificación de npm publicada.
4. `summary` falla el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación beta/estable publicada.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de commit `package_ref` de confianza. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de workflow/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen de confianza más antiguos sin ejecutar lógica de workflow antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para despachos independientes.

Las verificaciones de lanzamiento llaman a Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` y `telegram_mode=mock-openai`. Los fragmentos Docker de ruta de lanzamiento cubren los carriles superpuestos de paquete/actualización/plugin; Package Acceptance conserva la compatibilidad nativa del artefacto con canales incluidos, plugins sin conexión y prueba de Telegram contra el mismo tarball de paquete resuelto. Las verificaciones de lanzamiento entre sistemas operativos siguen cubriendo el onboarding, el instalador y el comportamiento de plataforma específicos del sistema operativo; la validación de producto de paquete/actualización debe empezar con Package Acceptance. Los carriles nuevos de paquete e instalador de Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta sin procesar de Windows. El smoke de turno de agente entre sistemas operativos de OpenAI usa por defecto `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, usa `openai/gpt-5.4-mini`, de modo que la prueba de instalación y Gateway se mantenga rápida y determinista.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas delimitadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar `update.channel` persistente faltante;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir sobre archivos de sello de metadatos de compilación local que ya se habían enviado. Los paquetes posteriores deben cumplir los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquete, empieza por el resumen `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución secundaria `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de carril, tiempos de fase y comandos de repetición de ejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los carriles Docker exactos en lugar de repetir toda la validación de lanzamiento.

## Smoke de instalación

El workflow separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquete, cambios de paquete/manifiesto de plugins incluidos o superficies principales de plugin/canal/gateway/Plugin SDK que ejercitan los jobs smoke de Docker. Los cambios de solo código fuente en plugins incluidos, las ediciones de solo pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila la imagen raíz de Dockerfile una vez, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes del espacio de trabajo compartido, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de plugins incluidos bajo un timeout agregado de comando de 240 segundos (cada ejecución Docker de escenario limitada por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura Docker/de actualización del instalador para ejecuciones programadas nocturnas, despachos manuales, verificaciones de lanzamiento por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke de GHCR para el Dockerfile raíz con SHA objetivo, luego ejecuta la instalación de paquete QR, smokes de Dockerfile raíz/gateway, smokes de instalador/actualización y el E2E Docker rápido de plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de los smokes de imagen raíz.

Los pushes a `main` (incluidos commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene el smoke Docker rápido y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento del proveedor de imágenes con instalación global de Bun se controla por separado con `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de verificaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y pushes a `main` no. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor Node/Git básico para carriles de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Conteo de ranuras del pool principal para carriles normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Conteo de ranuras del pool de cola sensible a proveedores.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de carriles en vivo concurrentes para que los proveedores no apliquen throttling.      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de carriles concurrentes de instalación npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de carriles multiservicio concurrentes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de carriles para evitar tormentas de creación del daemon Docker; define `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de respaldo por carril (120 minutos); algunos carriles live/tail usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del programador sin ejecutar carriles.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de carriles separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede arrancar desde un pool vacío, luego se ejecuta solo hasta liberar capacidad. Los preflights agregados locales de Docker eliminan contenedores OpenClaw E2E obsoletos, emiten estado de carriles activos, persisten tiempos de carriles para ordenamiento de mayor a menor duración y, por defecto, dejan de programar nuevos carriles agrupados tras el primer fallo.

### Workflow reutilizable live/E2E

El workflow reutilizable live/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, carril y cobertura de credenciales se requieren. `scripts/docker-e2e.mjs` luego convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y sube imágenes GHCR Docker E2E básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza las entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las descargas de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento, de modo que un flujo de registro/caché atascado se reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada fragmento descarga solo el tipo de imagen que necesita y ejecuta múltiples carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Los fragmentos Docker de la versión actual son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hasta `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` y `bundled-channels-contracts`. El fragmento agregado `bundled-channels` sigue disponible para repeticiones manuales únicas, y `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles de instalador de proveedores. El fragmento `bundled-channels` ejecuta carriles divididos `bundled-channel-*` y `bundled-channel-update-*` en lugar del carril serial todo en uno `bundled-channel-deps`.

OpenWebUI se incluye en `plugins-runtime-services` cuando la cobertura completa de la ruta de lanzamiento lo solicita, y mantiene un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del plan del programador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmento, lo que mantiene la depuración de carriles fallidos limitada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto del paquete para esa ejecución; si un carril seleccionado es un carril Docker en vivo, el trabajo dirigido compila localmente la imagen de pruebas en vivo para esa repetición. Los comandos de repetición por carril generados para GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparada cuando esos valores existen, de modo que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El flujo de trabajo programado live/E2E ejecuta diariamente la suite Docker completa de la ruta de lanzamiento.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Las solicitudes de incorporación normales, los envíos a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos entre ocho workers de extensiones; esos trabajos de shard de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen trabajos de CI adicionales.

## QA Lab

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente.

- El flujo de trabajo `Parity gate` se ejecuta en cambios de PR coincidentes y en despacho manual; compila el runtime privado de QA y compara los paquetes agénticos simulados de GPT-5.5 y Opus 4.6.
- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en despacho manual; distribuye en paralelo la puerta de paridad simulada, el carril Matrix en vivo y los carriles Telegram y Discord en vivo. Los trabajos en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan los carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como simulados (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia de modelos en vivo y del arranque normal de plugins de proveedor. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad del proveedor está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, y añade `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles QA Lab críticos para el lanzamiento antes de la aprobación del lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como trabajos de carril paralelos, y luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

No pongas la ruta de integración de PR detrás de `Parity gate` a menos que el cambio realmente toque el runtime de QA, la paridad de paquetes de modelos o una superficie propiedad del flujo de trabajo de paridad. Para arreglos normales de canal, configuración, documentación o pruebas unitarias, trátalo como una señal opcional y sigue la evidencia de CI/comprobaciones con alcance.

## CodeQL

El flujo de trabajo `CodeQL` es intencionadamente un escáner de seguridad estrecho de primera pasada, no un barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de solicitudes de incorporación que no son borrador escanean código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de solicitudes de incorporación se mantiene ligera: solo comienza para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Línea base de autenticación, secretos, sandbox, cron y Gateway                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo más el runtime de plugins de canal, Gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies del núcleo de SSRF, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente                    |
| `/codeql-security-high/plugin-trust-boundary`     | Instalación de Plugin, cargador, manifiesto, registro, preparación de dependencias de runtime, carga de fuentes y superficies de confianza del contrato de paquete de Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard programado de seguridad de Android. Compila la app Android manualmente para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la validación de coherencia del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de seguridad de macOS. Compila la app macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard equivalente no relacionado con seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el runner Blacksmith Linux más pequeño. Su protección de solicitudes de incorporación es intencionadamente más pequeña que el perfil programado: las PR que no son borrador solo ejecutan los shards coincidentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, runtime de canales del núcleo y plugins de canales incluidos, protocolo Gateway/método de servidor, runtime de memoria/enlace de SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de plugins, contrato de paquete/Plugin SDK o runtime de respuestas de Plugin SDK. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan los doce shards de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                                | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, Cron y Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de E/S                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas del protocolo Gateway y contratos de métodos del servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal core y del Plugin de canal incluido                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias del SDK de Plugin de memoria, pegamento de activación del runtime de memoria y comandos doctor de memoria                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Elementos internos de la cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del SDK de Plugin, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro del runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/búsqueda/fetch/embeddings    |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la UI de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/búsqueda web core, E/S de medios, comprensión de medios, generación de imágenes y generación de medios                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y entrypoint del SDK de Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente del SDK de Plugin del lado del paquete publicado y helpers de contrato del paquete de plugin                                                                                      |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, desactivarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex orientada por eventos para mantener la documentación existente alineada con los cambios recientemente integrados. No tiene una programación pura: una ejecución de CI exitosa por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de workflow se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex orientada por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa por push no bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de workflow ya se ejecutó o está en ejecución ese día UTC. El despacho manual omite esa puerta de actividad diaria. La vía crea un informe de rendimiento de Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. Si la base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que llegue el push del bot, la vía hace rebase del parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicadas después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un workflow manual para mantenedores destinado a la limpieza de duplicados posterior a la integración. De forma predeterminada usa dry-run y solo cierra PR listadas explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que la PR integrada esté fusionada y que cada duplicado tenga un issue referenciado compartido o hunks modificados que se solapen.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de verificación local y enrutamiento de cambios

La lógica local de vías modificadas vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de verificación local es más estricta respecto a los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción core ejecutan typecheck de producción core y de pruebas core, además de lint/guards core;
- los cambios solo de pruebas core ejecutan solo typecheck de pruebas core, además de lint core;
- los cambios de producción de extensión ejecutan typecheck de producción de extensión y de pruebas de extensión, además de lint de extensión;
- los cambios solo de pruebas de extensión ejecutan typecheck de pruebas de extensión, además de lint de extensión;
- los cambios públicos del SDK de Plugin o del contrato de plugin se expanden al typecheck de extensiones porque las extensiones dependen de esos contratos core (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los aumentos de versión solo de metadatos de release ejecutan verificaciones específicas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de verificación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega en salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible de grupo, el modo de entrega de respuesta de origen o el prompt de sistema de la herramienta de mensajes pasan por las pruebas core de respuesta, además de regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repo y prefiere una caja recién calentada para pruebas amplias. Antes de gastar una puerta lenta en una caja que fue reutilizada, expiró o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La verificación de cordura falla rápido cuando archivos raíz requeridos como `pnpm-lock.yaml` desaparecieron o cuando `git status --short` muestra al menos 200 eliminaciones con seguimiento. Eso suele significar que el estado de sincronización remota no es una copia confiable de la PR; detén esa caja y calienta una nueva en lugar de depurar el fallo de prueba del producto. Para PR con eliminaciones grandes intencionales, establece `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
