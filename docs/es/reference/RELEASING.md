---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de lanzamiento o de la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de comprobación del operador, cajas de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-05-01T05:33:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales públicos de lanzamiento:

- estable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: la punta móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión estable promovida actual de npm
- `beta` significa el destino actual de instalación beta
- Los lanzamientos estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más tarde una compilación beta validada
- Cada lanzamiento estable de OpenClaw distribuye el paquete npm y la aplicación macOS juntos;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, con
  la compilación/firma/notarización de la aplicación de Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamiento

- Los lanzamientos avanzan primero por beta
- Estable solo sigue después de validar la beta más reciente
- Los mantenedores normalmente crean lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir del `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el manual operativo de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo más reciente, confirma que el commit objetivo se haya enviado,
   y confirma que el CI actual de `main` esté lo bastante verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la
   compatibilidad caducada solo cuando la ruta de actualización siga cubierta, o registra por qué se
   mantiene intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista y luego ejecuta la
   comprobación previa determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento solo para validación
   previa. Guarda el `preflight_run_id` correcto.
7. Inicia todas las pruebas de prelanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA completo del commit. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo,
   canal, trabajo de workflow, perfil de paquete, proveedor o lista de permitidos de modelos más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada haga
   obsoleta la evidencia previa.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, publica con el dist-tag de npm `beta` y luego ejecuta
   la aceptación de paquete posterior a la publicación contra el paquete `openclaw@YYYY.M.D-beta.N`
   o `openclaw@beta` publicado. Si una beta enviada o publicada necesita una corrección, crea
   la siguiente `-beta.N`; no elimines ni reescribas la beta anterior.
10. Para estable, continúa solo después de que la beta validada o el candidato de lanzamiento tenga la
    evidencia de validación requerida. La publicación estable de npm reutiliza el artefacto de
    comprobación previa correcto mediante `preflight_run_id`; la preparación del lanzamiento estable de macOS
    también requiere el `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el
    `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E opcional independiente
    de Telegram con npm publicado cuando necesites evidencia de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesaria, las notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa coincidente de `CHANGELOG.md`, y los pasos del anuncio de lanzamiento.

## Comprobación previa del lanzamiento

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de ciclos de
  importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados
  `dist/*` y el paquete de Control UI existan para el paso de validación
  del paquete
- Ejecuta el workflow manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todas las cajas de prueba previas al lanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA de commit completo, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para install smoke, package acceptance, suites de ruta de lanzamiento de Docker,
  live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram.
  Proporciona `npm_telegram_package_spec` solo después de que se haya
  publicado un paquete y también deba ejecutarse el E2E de Telegram posterior a la publicación. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba probar que la
  validación coincide con un paquete npm publicado sin forzar Telegram E2E.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el workflow manual `Package Acceptance` cuando quieras una prueba por canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 requerido; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El workflow resuelve el candidato como
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto
  de paquete es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles de paquete/actualización/Plugin nativos del artefacto sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta el workflow manual `CI` directamente cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Linux Node, shards de plugins incluidos, contratos de canal,
  compatibilidad con Node 22, `check`, `check-additional`, build smoke,
  comprobaciones de documentación, Python skills, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de span de traza
  exportados, los atributos acotados y la redacción de contenido/identificadores sin
  requerir Opik, Langfuse ni otro recolector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la puerta de paridad simulada de QA Lab más el perfil rápido
  live Matrix y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI.
  Ejecuta el workflow manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte
  Matrix, medios y E2EE en paralelo.
- La validación de runtime de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  workflow reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras que las comprobaciones live más lentas permanecen en su
  propio carril para que no retrasen ni bloqueen la publicación
- Las comprobaciones de lanzamiento que contienen secretos deben despacharse mediante `Full Release
Validation` o desde el workflow ref `main`/release para que la lógica del workflow y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA de commit completo siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- El preflight solo de validación de `OpenClaw NPM Release` también acepta el SHA de commit completo
  actual de 40 caracteres de la rama del workflow sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de
  Blacksmith
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- El preflight de lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro
  publicado en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales arrendadas de Telegram.
  Los casos puntuales locales de maintainers pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los maintainers pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento de maintainers ahora usa preflight-luego-promocionar:
  - la publicación real de npm debe pasar un `preflight_run_id` de npm exitoso
  - la publicación real de npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución de preflight exitosa
  - los lanzamientos npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante entrada de workflow
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras que el
    repositorio público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una
    rama de lanzamiento pero el workflow se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de Mac debe pasar `preflight_run_id` y `validate_run_id`
    privados de Mac exitosos
  - las rutas reales de publicación promocionan artefactos preparados en lugar de reconstruirlos
    de nuevo
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización de prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la
  carga estable base
- El preflight de lanzamiento npm falla cerrado salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que la instalación del registro publicado
  contenga dependencias de runtime de plugins incluidos no vacías bajo el diseño raíz `dist/*`.
  Un lanzamiento que se envía con cargas de dependencias de Plugin incluidas faltantes o vacías
  falla el verificador postpublish y no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también hace cumplir el presupuesto de `unpackedSize` de npm pack en
  el tarball candidato de actualización, por lo que el e2e de instalador detecta aumentos accidentales del paquete
  antes de la ruta de publicación de lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un diseño de CI obsoleto
- La preparación para lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe conservar un bundle id que no sea de depuración, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso de build canónico de Sparkle
    para esa versión de lanzamiento

## Cajas de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Ejecútalo desde el workflow ref de confianza `main` y pasa la rama
de lanzamiento, etiqueta o SHA de commit completo como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El workflow resuelve el ref objetivo, despacha `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks` y
opcionalmente despacha Telegram E2E posterior a la publicación independiente cuando
`npm_telegram_package_spec` está establecido. `OpenClaw Release Checks` luego expande
install smoke, comprobaciones de lanzamiento entre sistemas operativos, cobertura live/E2E de ruta de lanzamiento de Docker,
Package Acceptance con QA de paquete de Telegram, paridad de QA Lab, Matrix live y
Telegram live. Una ejecución completa solo es aceptable cuando el resumen de `Full Release Validation`
muestra `normal_ci` y `release_checks` como exitosos, y cualquier hijo opcional
`npm_telegram` es exitoso o fue omitido intencionalmente. El resumen final del
verificador incluye tablas de trabajos más lentos para cada ejecución hija, para que el release
manager pueda ver la ruta crítica actual sin descargar logs.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la
matriz completa de etapas, nombres exactos de trabajos del workflow, diferencias entre perfiles stable y full,
artefactos y manejadores de repetición enfocada.
Los workflows hijos se despachan desde el ref de confianza que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando el `ref` objetivo apunta a una
rama o etiqueta de lanzamiento anterior. No hay una entrada separada de workflow-ref de Full Release Validation;
elige el arnés de confianza eligiendo el ref de ejecución del workflow.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: ruta más rápida crítica para lanzamiento de OpenAI/core live y Docker
- `stable`: mínimo más cobertura estable de proveedor/backend para aprobación de lanzamiento
- `full`: stable más cobertura amplia de proveedor/medios consultiva

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia de destino una sola vez como `release-package-under-test` y reutiliza ese artefacto tanto en las comprobaciones Docker de ruta de lanzamiento como en Package Acceptance. Esto mantiene todas las cajas orientadas a paquetes sobre los mismos bytes y evita compilaciones repetidas del paquete. El smoke de instalación OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definida la variable del repositorio u organización; de lo contrario, usa `openai/gpt-5.4-mini`, porque este carril demuestra la instalación del paquete, la incorporación, el arranque del gateway y un turno de agente en vivo, no la evaluación comparativa del modelo predeterminado más lento. La matriz más amplia de proveedores en vivo sigue siendo el lugar para la cobertura específica de modelos.

Usa estas variantes según la etapa del lanzamiento:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No uses el paraguas completo como la primera repetición después de una corrección enfocada. Si falla una caja, usa el flujo de trabajo hijo, el trabajo, el carril Docker, el perfil de paquete, el proveedor de modelo o el carril de QA que falló para la siguiente prueba. Vuelve a ejecutar el paraguas completo solo cuando la corrección haya cambiado la orquestación compartida del lanzamiento o haya dejado obsoleta la evidencia previa de todas las cajas. El verificador final del paraguas vuelve a comprobar los ids registrados de las ejecuciones de los flujos de trabajo hijos, así que después de que un flujo de trabajo hijo se vuelva a ejecutar correctamente, vuelve a ejecutar solo el trabajo padre fallido `Verify full validation`.

Para una recuperación delimitada, pasa `rerun_group` al paraguas. `all` es la ejecución real del candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease` ejecuta solo el hijo de plugins exclusivo del lanzamiento, `release-checks` ejecuta todas las cajas de lanzamiento, y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram` cuando se proporciona el carril Telegram de paquete independiente.

### Vitest

La caja de Vitest es el flujo de trabajo hijo manual `CI`. CI manual omite intencionalmente el alcance por cambios y fuerza el grafo normal de pruebas para el candidato de lanzamiento: shards Linux Node, shards de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, Android e i18n de Control UI.

Usa esta caja para responder "¿pasó el árbol de código fuente la suite de pruebas normal completa?". No es lo mismo que la validación del producto en la ruta de lanzamiento. Evidencia que conviene conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` en verde sobre el SHA de destino exacto
- nombres de shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesite CI normal determinista, pero no las cajas Docker, QA Lab, en vivo, entre sistemas operativos o de paquete:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La caja Docker vive en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo lanzamiento. Valida el candidato de lanzamiento mediante entornos Docker empaquetados, no solo con pruebas a nivel de código fuente.

La cobertura Docker de lanzamiento incluye:

- smoke de instalación completa con el smoke de instalación global lenta de Bun habilitado
- preparación/reutilización de la imagen smoke del Dockerfile raíz por SHA de destino, con trabajos de QR, raíz/gateway e instalador/Bun smoke ejecutándose como shards separados de install-smoke
- carriles E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` y `bundled-channels-contracts`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- carriles divididos de dependencias de canales incluidos entre fragmentos de channel-smoke, update-target y contratos de setup/runtime en lugar de un único trabajo grande de canales incluidos
- carriles divididos de instalación/desinstalación de plugins incluidos `bundled-plugin-install-uninstall-0` hasta `bundled-plugin-install-uninstall-23`
- suites de proveedores en vivo/E2E y cobertura de modelos Docker en vivo cuando las comprobaciones de lanzamiento incluyen suites en vivo

Usa los artefactos Docker antes de volver a ejecutar. El planificador de ruta de lanzamiento sube `.artifacts/docker-tests/` con registros de carriles, `summary.json`, `failures.json`, tiempos por fase, JSON del plan del planificador y comandos de repetición. Para una recuperación enfocada, usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de volver a ejecutar todos los fragmentos de lanzamiento. Los comandos de repetición generados incluyen el `package_artifact_run_id` previo y entradas de imágenes Docker preparadas cuando están disponibles, de modo que un carril fallido puede reutilizar el mismo tarball y las mismas imágenes GHCR.

### QA Lab

La caja QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento para comportamiento agéntico y a nivel de canal, separada de Vitest y de la mecánica de paquetes Docker.

La cobertura QA Lab de lanzamiento incluye:

- puerta de paridad mock que compara el carril candidato de OpenAI con la línea base Opus 4.6 usando el paquete de paridad agéntica
- perfil rápido de QA Matrix en vivo usando el entorno `qa-live-shared`
- carril QA de Telegram en vivo usando préstamos de credenciales CI de Convex
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta caja para responder "¿se comporta correctamente el lanzamiento en escenarios de QA y flujos de canales en vivo?". Conserva las URL de artefactos de los carriles de paridad, Matrix y Telegram al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una ejecución manual shardeada de QA-Lab, no como el carril crítico de lanzamiento predeterminado.

### Paquete

La caja Package es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un candidato en el tarball `package-under-test` consumido por Docker E2E, valida el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene separada la referencia del arnés del flujo de trabajo de la referencia de origen del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo de `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` obligatorio
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` y `telegram_mode=mock-openai`. Los fragmentos Docker de ruta de lanzamiento cubren los carriles superpuestos de instalación, actualización y actualización de plugins; Package Acceptance conserva la compatibilidad de canales incluidos nativa de artefactos, fixtures de plugins sin conexión y QA de paquete de Telegram contra el mismo tarball resuelto. Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen siendo importantes para la incorporación, el instalador y el comportamiento específicos del sistema operativo, pero la validación de producto de paquete/actualización debería preferir Package Acceptance.

La permisividad heredada de package-acceptance está intencionalmente limitada en el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas en npm: entradas privadas de inventario QA ausentes del tarball, falta de `gateway install --wrapper`, falta de archivos de parche en el fixture git derivado del tarball, falta de persistencia de `update.channel`, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes; esas mismas brechas hacen fallar la validación de lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta del lanzamiento sea sobre un paquete instalable real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfiles de paquete comunes:

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red de gateway y recarga de configuración
- `package`: contratos de instalación/actualización/paquete de plugins sin ClawHub en vivo; este es el valor predeterminado de release-check
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
- `full`: fragmentos Docker de ruta de lanzamiento con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para prueba de Telegram de candidato de paquete, habilita `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball `package-under-test` resuelto al carril Telegram; el flujo de trabajo Telegram independiente sigue aceptando una especificación npm publicada para comprobaciones posteriores a la publicación.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit completo de 40 caracteres actual de la rama del flujo de trabajo para preflight solo de validación
- `preflight_only`: `true` para validación/compilación/paquete únicamente, `false` para la ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado de la ejecución preflight correcta
- `npm_dist_tag`: etiqueta de destino npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo que validar. Las comprobaciones con secretos requieren que el commit resuelto sea alcanzable desde una rama o etiqueta de lanzamiento de OpenClaw.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante preflight; el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento estable de npm

Al cortar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA del commit actual completo de la rama del flujo de trabajo para una ejecución de prueba solo de validación del flujo de trabajo de comprobación previa
2. Elige `npm_dist_tag=beta` para el flujo normal con beta primero, o `latest` solo cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA completo del commit cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta en su lugar el flujo de trabajo manual `CI` en la referencia de lanzamiento
5. Guarda el `preflight_run_id` exitoso
6. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, el mismo `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
7. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo privado `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta` debe seguir la misma compilación estable de inmediato, usa ese mismo flujo de trabajo privado para apuntar ambos dist-tags a la versión estable, o deja que su sincronización programada de autorreparación mueva `beta` más tarde

La mutación de dist-tags vive en el repositorio privado por seguridad porque todavía requiere `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción con beta primero documentadas y visibles para operadores.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la CLI de 1Password (`op`) solo dentro de una sesión dedicada de tmux. No llames a `op` directamente desde la shell principal del agente; mantenerlo dentro de tmux hace que los prompts, alertas y manejo de OTP sean observables y evita alertas repetidas del host.

## Referencias públicas

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los mantenedores usan la documentación privada de lanzamientos en [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) para el runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
