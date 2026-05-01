---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de validación de lanzamiento
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-01T05:30:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El job `preflight` clasifica el diff y desactiva las lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el scoping inteligente y expanden todo el grafo para candidatos de release y validación amplia. Las lanes de Android siguen siendo opt-in mediante `include_android`. La cobertura de Plugin solo de release vive en el workflow separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o con un dispatch manual explícito.

## Resumen del pipeline

| Job                              | Propósito                                                                                    | Cuándo se ejecuta                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Detectar cambios solo de docs, scopes cambiados, extensiones cambiadas y construir el manifiesto de CI | Siempre en pushes y PRs no draft |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                      | Siempre en pushes y PRs no draft |
| `security-dependency-audit`      | Auditoría sin dependencias del lockfile de producción contra avisos de npm                   | Siempre en pushes y PRs no draft |
| `security-fast`                  | Agregado requerido para los jobs rápidos de seguridad                                       | Siempre en pushes y PRs no draft |
| `check-dependencies`             | Pasada de Knip solo de dependencias de producción más el guard de la allowlist de archivos sin usar | Cambios relevantes para Node     |
| `build-artifacts`                | Construir `dist/`, Control UI, checks de artefactos construidos y artefactos downstream reutilizables | Cambios relevantes para Node     |
| `checks-fast-core`               | Lanes rápidas de corrección en Linux, como checks de bundled/plugin-contract/protocol        | Cambios relevantes para Node      |
| `checks-fast-contracts-channels` | Checks de contrato de canales fragmentados con un resultado de check agregado estable        | Cambios relevantes para Node      |
| `checks-node-core-test`          | Shards de tests de Core Node, excluidas las lanes de canales, bundled, contratos y extensiones | Cambios relevantes para Node    |
| `check`                          | Equivalente fragmentado del gate local principal: tipos de prod, lint, guards, tipos de test y smoke estricto | Cambios relevantes para Node |
| `check-additional`               | Shards de arquitectura, límites, guards de superficie de extensiones, límites de paquetes y gateway-watch | Cambios relevantes para Node |
| `build-smoke`                    | Smoke tests de la CLI construida y smoke de memoria de inicio                               | Cambios relevantes para Node      |
| `checks`                         | Verificador para tests de canales con artefactos construidos                                | Cambios relevantes para Node      |
| `checks-node-compat-node22`      | Lane de build y smoke de compatibilidad con Node 22                                         | Dispatch manual de CI para releases |
| `check-docs`                     | Checks de formato, lint y enlaces rotos de docs                                             | Docs cambiados                    |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                            | Cambios relevantes para Python skills |
| `checks-windows`                 | Tests específicos de Windows para procesos/rutas más regresiones compartidas de especificadores de import runtime | Cambios relevantes para Windows |
| `macos-node`                     | Lane de tests TypeScript de macOS usando los artefactos construidos compartidos              | Cambios relevantes para macOS     |
| `macos-swift`                    | Lint, build y tests de Swift para la app de macOS                                           | Cambios relevantes para macOS     |
| `android`                        | Tests unitarios de Android para ambos flavors más una build de APK debug                    | Cambios relevantes para Android   |
| `test-performance-agent`         | Optimización diaria de tests lentos de Codex tras actividad confiable                       | Éxito de CI principal o dispatch manual |

## Orden de fail-fast

1. `preflight` decide qué lanes existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los jobs más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se superpone con las lanes rápidas de Linux para que los consumidores downstream puedan comenzar en cuanto la build compartida esté lista.
4. Luego se expanden las lanes más pesadas de plataforma y runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Los checks agregados de shards usan `!cancelled() && always()` para que sigan informando fallos normales de shards, pero no se encolen después de que todo el workflow ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Scope y enrutamiento

La lógica de scope vive en `scripts/ci-changed-scope.mjs` y está cubierta por tests unitarios en `src/scripts/ci-changed-scope.test.ts`. El dispatch manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si todas las áreas con scope hubieran cambiado.

- **Las ediciones del workflow de CI** validan el grafo de CI de Node más el linting del workflow, pero no fuerzan por sí mismas builds nativas de Windows, Android o macOS; esas lanes de plataforma siguen estando limitadas a cambios de código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratos de tests core y ediciones estrechas de helpers/enrutamiento de tests de contrato de Plugin** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, shards core completos, shards de plugins bundled y matrices de guards adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Los checks de Windows Node** se limitan a wrappers específicos de Windows para procesos/rutas, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies del workflow de CI que ejecutan esa lane; los cambios no relacionados de código fuente, plugins, install-smoke y solo tests permanecen en las lanes de Linux Node.

Las familias de tests Node más lentas se dividen o equilibran para que cada job siga siendo pequeño sin reservar runners de más: los contratos de canales se ejecutan como tres shards ponderados, las lanes pequeñas de unidades core se emparejan, auto-reply se ejecuta como cuatro workers equilibrados (con el subárbol reply dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de Gateway/Plugin se distribuyen entre los jobs agentic Node existentes solo de código fuente en lugar de esperar artefactos construidos. Los tests amplios de navegador, QA, medios y plugins varios usan sus configs dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards con patrones de inclusión registran entradas de timing usando el nombre del shard de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una config completa de un shard filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de límites de paquetes y separa la arquitectura de topología runtime de la cobertura de gateway watch; el shard de guard de límites ejecuta sus pequeños guards independientes concurrentemente dentro de un job. Gateway watch, los tests de canales y el shard core support-boundary se ejecutan concurrentemente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK debug de Play. El flavor de terceros no tiene source set ni manifiesto separados; su lane de tests unitarios sigue compilando el flavor con las flags BuildConfig de SMS/call-log, mientras evita un job duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo de dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de release de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción sin usar de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos sin usar falla cuando un PR añade un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la allowlist, mientras conserva superficies intencionales de Plugin dinámico, generadas, de build, live-test y de puente de paquetes que Knip no puede resolver estáticamente.

## Dispatches manuales

Los dispatches manuales de CI ejecutan el mismo grafo de jobs que CI normal, pero fuerzan la activación de cada lane con scope no Android: shards Linux Node, shards de bundled-plugin, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, build smoke, checks de docs, Skills de Python, Windows, macOS e i18n de Control UI. Los dispatches manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas de release completa habilita Android pasando `include_android=true`. Los checks estáticos de prerelease de Plugin, el shard `agentic-plugins` solo de release, el barrido completo por lotes de extensiones y las lanes Docker de prerelease de Plugin están excluidos de CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` dispara el workflow separado `Plugin Prerelease` con el gate de release-validation habilitado.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de release no sea cancelada por otro push o ejecución de PR en el mismo ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, tag o SHA completo de commit mientras usa el archivo de workflow del ref de dispatch seleccionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, trabajos de seguridad rápidos y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidas, comprobaciones fragmentadas de contrato de canales, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; la verificación previa de install-smoke también usa Ubuntu hospedado en GitHub para que la matriz de Blacksmith pueda encolarse antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de plugins de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Node en Linux, fragmentos de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el costo de tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

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

`Full Release Validation` es el flujo de trabajo manual paraguas para "ejecutar todo antes del lanzamiento". Acepta una rama, una etiqueta o un SHA de commit completo, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para la prueba de plugins/paquetes/estáticos/Docker solo de lanzamiento, y despacha `OpenClaw Release Checks` para install smoke, aceptación de paquetes, suites de ruta de lanzamiento de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. También puede ejecutar el flujo de trabajo posterior a la publicación `NPM Telegram Beta E2E` cuando se proporciona una especificación de paquete publicada.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de flujo de trabajo, las diferencias de perfiles, los artefactos y
los identificadores de reejecución enfocados.

`release_profile` controla la amplitud live/proveedor que se pasa a las comprobaciones de lanzamiento. Los
flujos de trabajo manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia consultiva de proveedores/medios.

- `minimum` conserva los carriles críticos de lanzamiento de OpenAI/núcleo más rápidos.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de las ejecuciones hijas despachadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y anexa tablas de los trabajos más lentos para cada ejecución hija. Si se reejecuta un flujo de trabajo hijo y pasa a verde, reejecuta solo el trabajo verificador padre para actualizar el resultado del paraguas y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo de CI completo normal, `plugin-prerelease` solo para el hijo de prelanzamiento de plugins, `release-checks` para cada hijo de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la reejecución de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la referencia confiable del flujo de trabajo para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al flujo de trabajo Docker live/E2E de ruta de lanzamiento como al fragmento de aceptación de paquetes. Eso mantiene consistentes los bytes del paquete entre cajas de lanzamiento y evita volver a empaquetar el mismo candidato en varios trabajos hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que
ya haya despachado cuando se cancela el padre, de modo que una validación más nueva de main
no quede detrás de una ejecución obsoleta de release-check de dos horas. La validación de rama/etiqueta
de lanzamiento y los grupos de reejecución enfocados mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El hijo live/E2E de lanzamiento conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos nombrados mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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
- fragmentos separados de medios de audio/vídeo y fragmentos de música filtrados por proveedor

Eso conserva la misma cobertura de archivos mientras facilita la reejecución y el diagnóstico de fallos lentos de proveedores live. Los nombres de fragmento agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para reejecuciones manuales puntuales.

Los fragmentos nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en ejecutores Blacksmith normales: los trabajos en contenedores son el lugar equivocado para lanzar pruebas Docker anidadas.

Los fragmentos live de modelos/backends respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El flujo de trabajo live de lanzamiento construye y publica esa imagen una vez, luego los fragmentos de modelo Docker live, Gateway fragmentado por proveedor, backend de CLI, enlace ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del trabajo del flujo de trabajo, para que un contenedor o ruta de limpieza atascados fallen rápido en lugar de consumir todo el presupuesto de release-check. Si esos fragmentos reconstruyen independientemente el objetivo Docker completo del código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` comprueba `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la referencia del flujo de trabajo, la referencia del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con el resumen del paquete cuando es necesario y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` específicos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos carriles como trabajos Docker específicos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el despacho independiente de Telegram aún puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si fallaron la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Orígenes candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de beta/estable publicada.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de confianza de `package_ref`. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea accesible desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un worktree desvinculado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen de confianza más antiguos sin ejecutar lógica antigua de flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugin sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para despachos independientes.

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` y `telegram_mode=mock-openai`. Los fragmentos Docker de la ruta de lanzamiento cubren los carriles superpuestos de paquete/actualización/plugin; Package Acceptance mantiene la compatibilidad de canales incluidos nativa del artefacto, el plugin sin conexión y la prueba de Telegram contra el mismo tarball de paquete resuelto. Las comprobaciones de lanzamiento entre sistemas operativos aún cubren incorporación, instalador y comportamiento de plataforma específicos del sistema operativo; la validación de producto de paquete/actualización debe comenzar con Package Acceptance. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada, con valor predeterminado `openclaw@latest`; los comandos de repetición de carriles fallidos conservan esa línea base. Las ejecuciones locales pueden establecer `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` en un paquete exacto como `openclaw@2026.4.15`. El carril publicado configura la línea base con una receta integrada del comando `openclaw config set`, y luego registra los pasos de la receta en `summary.json`. La cobertura más amplia de versiones anteriores debe dividir Package Acceptance entre valores exactos de `published_upgrade_survivor_baseline`. Los carriles de Windows empaquetado y de instalación limpia también verifican que un paquete instalado pueda importar una anulación de control del navegador desde una ruta absoluta sin procesar de Windows. El smoke de turno de agente OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` de forma predeterminada cuando está establecido; de lo contrario, usa `openai/gpt-5.4-mini`, para que la prueba de instalación y Gateway siga siendo rápida y determinista.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- entradas privadas de QA conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de plugin pueden leer ubicaciones heredadas de registro de instalación o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración sin dejar de exigir que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de marca de metadatos de compilación local que ya se habían enviado. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquete, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Luego inspecciona la ejecución secundaria de `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de carril, tiempos de fase y comandos de repetición. Prefiere repetir el perfil de paquete fallido o los carriles Docker exactos en lugar de repetir toda la validación de lanzamiento.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de ámbito mediante su propio trabajo `preflight`. Divide la cobertura de smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies Docker/paquete, cambios de paquete/manifiesto de plugin incluido, o superficies centrales de plugin/canal/Gateway/Plugin SDK que ejercitan los trabajos de smoke Docker. Los cambios solo de origen en plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers Docker. La ruta rápida compila la imagen raíz de Dockerfile una vez, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes en workspace compartido, ejecuta el e2e de gateway-network en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de plugin incluido bajo un timeout agregado de comando de 240 segundos (cada ejecución Docker de escenario se limita por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura Docker/actualización del instalador para ejecuciones programadas nocturnas, despachos manuales, comprobaciones de lanzamiento con llamada de flujo de trabajo y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de smoke del Dockerfile raíz de GHCR para el SHA objetivo, y luego ejecuta instalación de paquete QR, smokes de Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E Docker rápido de plugin incluido como trabajos separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos commits de merge) no fuerzan la ruta completa; cuando la lógica de ámbito de cambios solicitaría cobertura completa en un push, el flujo de trabajo mantiene el smoke Docker rápido y deja el smoke completo de instalación para validación nocturna o de lanzamiento.

El smoke lento del proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles enfocados en instalación.

## E2E Docker local

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor base de Node/Git para carriles de instalador/actualización/dependencias de plugin;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variable                               | Valor predeterminado | Propósito                                                                                       |
| -------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                   | Recuento de ranuras del pool principal para carriles normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                   | Recuento de ranuras del pool final sensible a proveedores.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                    | Límite de carriles en vivo simultáneos para que los proveedores no apliquen throttling.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                   | Límite de carriles simultáneos de instalación npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                    | Límite de carriles simultáneos con varios servicios.                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000                 | Escalonamiento entre inicios de carril para evitar tormentas de creación del daemon Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000              | Timeout de respaldo por carril (120 minutos); los carriles en vivo/finales seleccionados usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin establecer       | `1` imprime el plan del programador sin ejecutar carriles.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin establecer       | Lista exacta de carriles separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo todavía puede iniciar desde un grupo vacío y luego ejecutarse solo hasta que libere capacidad. El agregado local realiza comprobaciones previas de Docker, elimina contenedores E2E de OpenClaw obsoletos, emite el estado de carriles activos, conserva los tiempos de carril para la ordenación de mayor a menor duración y, de forma predeterminada, deja de programar nuevos carriles agrupados después del primer fallo.

### Flujo de trabajo live/E2E reutilizable

El flujo de trabajo live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, carril y cobertura de credenciales se requieren. Luego, `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y publica imágenes Docker E2E bare/functional de GHCR etiquetadas con el digest del paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza las entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes con digest de paquete en lugar de reconstruirlas. Las descargas de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento, para que un flujo de registro/caché bloqueado se reintente rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de la ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada fragmento descarga solo el tipo de imagen que necesita y ejecuta varios carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` y `bundled-channels-contracts`. El fragmento agregado `bundled-channels` sigue disponible para repeticiones manuales de una sola vez, y `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles de instalador de proveedores. El fragmento `bundled-channels` ejecuta carriles divididos `bundled-channel-*` y `bundled-channel-update-*` en lugar del carril serial todo en uno `bundled-channel-deps`.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de la ruta de lanzamiento lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del plan del programador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de carriles fallidos limitada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker live, el trabajo dirigido construye localmente la imagen de pruebas live para esa repetición. Los comandos de repetición por carril generados para GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, de modo que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # descargar artefactos Docker e imprimir comandos de repetición dirigidos combinados/por carril
pnpm test:docker:timings <summary>   # resúmenes de carriles lentos y ruta crítica de fases
```

El flujo de trabajo live/E2E programado ejecuta diariamente toda la suite Docker de la ruta de lanzamiento.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Las solicitudes de cambios normales, los envíos a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugin incluidos entre ocho trabajadores de extensiones; esos trabajos de fragmentos de extensiones ejecutan hasta dos grupos de configuración de Plugin a la vez, con un trabajador Vitest por grupo y un heap de Node más grande, para que los lotes de Plugin con muchas importaciones no creen trabajos de CI adicionales. La ruta de prelanzamiento Docker exclusiva de lanzamiento agrupa carriles Docker dirigidos en grupos pequeños para evitar reservar decenas de ejecutores para trabajos de uno a tres minutos.

## Laboratorio de QA

El laboratorio de QA tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente.

- El flujo de trabajo `Parity gate` se ejecuta en cambios coincidentes de solicitudes de cambios y en despacho manual; construye el runtime privado de QA y compara los paquetes agénticos simulados de GPT-5.5 y Opus 4.6.
- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante despacho manual; expande como trabajos paralelos la puerta de paridad simulada, el carril live de Matrix y los carriles live de Telegram y Discord. Los trabajos live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan los carriles de transporte live de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como simulados (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`), de modo que el contrato del canal quede aislado de la latencia del modelo live y del arranque normal del Plugin de proveedor. El Gateway de transporte live desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores se cubre mediante las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, y añade `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; el despacho manual `matrix_profile=all` siempre fragmenta la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento del laboratorio de QA antes de la aprobación del lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y base como trabajos de carril paralelos, y luego descarga ambos artefactos en un trabajo pequeño de informe para la comparación final de paridad.

No pongas la ruta de aterrizaje de solicitudes de cambios detrás de `Parity gate` salvo que el cambio realmente toque el runtime de QA, la paridad de paquetes de modelo o una superficie que pertenezca al flujo de trabajo de paridad. Para correcciones normales de canales, configuración, documentación o pruebas unitarias, trátalo como una señal opcional y sigue la evidencia de CI/comprobaciones con alcance.

## CodeQL

El flujo de trabajo `CodeQL` es intencionadamente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de solicitudes de cambios no borrador escanean el código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo, con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de solicitudes de cambios se mantiene ligera: solo inicia para cambios en `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL de Android y macOS quedan fuera de los valores predeterminados de solicitudes de cambios.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, Cron y línea base de Gateway                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales principales más runtime de Plugin de canal, Gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies principales de SSRF, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agentes                   |
| `/codeql-security-high/plugin-trust-boundary`     | Instalación de Plugin, loader, manifiesto, registro, preparación de dependencias de runtime, carga de fuentes y superficies de confianza del contrato de paquete de Plugin SDK |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Construye manualmente la app de Android para CodeQL en el ejecutor Linux de Blacksmith más pequeño aceptado por la comprobación de cordura del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Construye manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript de gravedad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el ejecutor Linux de Blacksmith más pequeño. Su protección de solicitudes de cambios es intencionadamente más pequeña que el perfil programado: las solicitudes de cambios no borrador solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/E/S de configuración, código de autenticación/secretos/sandbox/seguridad, runtime de canales principales y Plugin de canales incluidos, protocolo/método de servidor de Gateway, runtime de memoria/pegamento de SDK, entrega MCP/proceso/saliente, runtime de proveedores/catálogo de modelos, diagnósticos de sesión/colas de entrega, loader de Plugin, contrato de paquete de Plugin SDK o runtime de respuestas de Plugin SDK. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan los doce fragmentos de calidad de solicitudes de cambios.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son puntos de apoyo de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                              |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, Cron y Gateway                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de E/S                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal central y del Plugin de canal incluido                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y tiempo de ejecución del plano de control ACP           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, asistentes de supervisión de procesos y contratos de entrega saliente                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de tiempo de ejecución de memoria, alias del SDK de Plugin de memoria, enlace de activación del tiempo de ejecución de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesiones, asistentes de enlace/entrega de sesiones salientes, superficies de eventos de diagnóstico/paquetes de registros y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del SDK de Plugin, asistentes de carga útil/fragmentación/tiempo de ejecución de respuestas, opciones de respuesta de canal, colas de entrega y asistentes de enlace de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogos de modelos, autenticación y descubrimiento de proveedores, registro de tiempo de ejecución de proveedores, valores predeterminados/catálogos de proveedores y registros de web/búsqueda/obtención/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la interfaz de control, persistencia local, flujos de control de Gateway y contratos de tiempo de ejecución del plano de control de tareas                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de tiempo de ejecución de obtención/búsqueda web central, E/S de medios, comprensión de medios, generación de imágenes y generación de medios                 |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y puntos de entrada del SDK de Plugin                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del SDK de Plugin del lado del paquete y asistentes de contratos de paquetes de Plugin                                                         |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y Plugins incluidos debe volver a añadirse como trabajo de seguimiento delimitado o fragmentado solo después de que los perfiles estrechos tengan tiempo de ejecución y señal estables.

## Flujos de trabajo de mantenimiento

### Docs Agent

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex orientado por eventos para mantener la documentación existente alineada con los cambios aterrizados recientemente. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, por lo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Test Performance Agent

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex orientado por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa compuerta de actividad diaria. El carril genera un informe de rendimiento agrupado de Vitest para la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el conteo base de pruebas aprobadas. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe aprobar antes de que se confirme nada. Cuando `main` avanza antes de que aterrice el push del bot, el carril aplica rebase al parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicados después del merge

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenedores para la limpieza de duplicados posterior al aterrizaje. De forma predeterminada se ejecuta en modo simulación y solo cierra los PR indicados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de comprobación local y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta de comprobación local es más estricta sobre los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción del núcleo y de pruebas del núcleo, más lint/guardias del núcleo;
- los cambios solo de pruebas del núcleo ejecutan únicamente la comprobación de tipos de pruebas del núcleo, más lint del núcleo;
- los cambios de producción de extensiones ejecutan la comprobación de tipos de producción de extensiones y de pruebas de extensiones, más lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan la comprobación de tipos de pruebas de extensiones, más lint de extensiones;
- los cambios públicos del SDK de Plugin o del contrato de Plugin se expanden a la comprobación de tipos de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones con Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` e intencionalmente es más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren asignaciones explícitas, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de sala de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible para el grupo, el modo de entrega de respuestas de origen o el prompt de sistema de la herramienta de mensajes pasan por las pruebas centrales de respuestas, más regresiones de entrega de Discord y Slack para que un cambio compartido predeterminado falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación con Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja recién preparada para pruebas amplias. Antes de gastar una compuerta lenta en una caja reutilizada, expirada o que acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de cordura falla rápido cuando desaparecen archivos raíz obligatorios como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remota no es una copia confiable del PR; detén esa caja y prepara una nueva en lugar de depurar el fallo de prueba del producto. Para PR con eliminaciones grandes intencionales, establece `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de Blacksmith CLI que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para deshabilitar esa guardia, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
