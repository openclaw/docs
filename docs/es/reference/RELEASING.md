---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de lanzamiento o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Carriles de lanzamiento, lista de verificación del operador, cajas de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-05-02T05:35:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce380a8277e7c8764359e4ded86d1042dcb250691ac62fbee28651f20aa0580
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales públicos de lanzamiento:

- stable: versiones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de preversión que se publican en npm `beta`
- dev: la cabeza móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento estable de corrección: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de preversión beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión estable promovida actual de npm
- `beta` significa el destino de instalación beta actual
- Las versiones estables y estables de corrección se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más tarde una compilación beta revisada
- Cada lanzamiento estable de OpenClaw incluye juntos el paquete de npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta de npm/paquete, con
  la compilación/firma/notarización de la app para Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente preparan lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir del `main` actual, para que la validación del lanzamiento y las correcciones no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores preparan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el runbook de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae los últimos cambios, confirma que el commit objetivo esté enviado,
   y confirma que el CI del `main` actual esté lo bastante verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, confirma el cambio, envíalo y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la
   compatibilidad vencida solo cuando la ruta de actualización siga cubierta, o registra por qué se
   conserva intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas el trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, luego ejecuta la
   comprobación previa local determinista:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento para una comprobación previa
   solo de validación. Guarda el `preflight_run_id` correcto.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, la etiqueta o el SHA de commit completo. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, carril,
   trabajo de workflow, perfil de paquete, proveedor o allowlist de modelos fallido más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada vuelva
   obsoleta la evidencia previa.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, publica con el dist-tag de npm `beta`, luego ejecuta
   la aceptación de paquete posterior a la publicación contra el paquete `openclaw@YYYY.M.D-beta.N`
   o `openclaw@beta` publicado. Si una beta enviada o publicada necesita una corrección, prepara
   la siguiente `-beta.N`; no elimines ni reescribas la beta anterior.
10. Para stable, continúa solo después de que la beta revisada o la candidata de lanzamiento tenga la
    evidencia de validación requerida. La publicación estable de npm reutiliza el artefacto correcto
    de comprobación previa mediante `preflight_run_id`; la preparación del lanzamiento estable de macOS
    también requiere los `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el
    `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E opcional de Telegram
    publicado en npm independiente cuando necesites prueba del canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, las notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Comprobación previa de lanzamiento

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de ciclos de
  importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento
  `dist/*` esperados y el paquete de Control UI existan para el paso de validación
  del empaquetado
- Ejecuta el flujo de trabajo manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todos los cuadros de prueba de prelanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para install smoke, package acceptance, conjuntos de ruta de lanzamiento de Docker,
  live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta el E2E de Telegram de paquete contra el artefacto
  `release-package-under-test` de las comprobaciones de lanzamiento. Proporciona `npm_telegram_package_spec`
  después de publicar cuando el mismo E2E de Telegram también deba probar el paquete npm publicado. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba probar que la validación coincide con un
  paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo de trabajo manual `Package Acceptance` cuando quieras una prueba por canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El flujo de trabajo resuelve el candidato como
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles de paquete/actualización/Plugin nativos del artefacto sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta directamente el flujo de trabajo manual `CI` cuando solo necesites la cobertura normal completa de CI
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el acotamiento por cambios
  y fuerzan los shards de Linux Node, shards de plugins incluidos, contratos de canal,
  compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación,
  comprobaciones de documentación, Skills de Python, Windows, macOS, Android e i18n de Control UI
  lanes.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de trazas
  exportados, atributos delimitados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse ni otro recopilador externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la puerta de paridad simulada de QA Lab más el perfil rápido
  de Matrix en vivo y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles en vivo
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI.
  Ejecuta el flujo de trabajo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte,
  medios y E2EE de Matrix en paralelo.
- La validación de runtime de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  flujo de trabajo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones en vivo más lentas permanecen en su
  propio carril para que no detengan ni bloqueen la publicación
- Las comprobaciones de lanzamiento que llevan secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de flujo de trabajo `main`/release para que la lógica del flujo de trabajo y los
  secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o etiqueta de lanzamiento
- El preflight solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual
  de 40 caracteres del commit de rama de flujo de trabajo sin requerir una etiqueta publicada
- Esa ruta por SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras la ruta de validación no mutante puede usar los runners Linux más grandes de
  Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- El preflight de lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y E2E real de Telegram
  contra el paquete npm publicado usando el conjunto compartido de credenciales arrendadas de Telegram.
  Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamientos de mantenedores ahora usa preflight y luego promoción:
  - la publicación real en npm debe superar un npm `preflight_run_id` exitoso
  - la publicación real en npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución exitosa de preflight
  - los lanzamientos estables de npm usan `beta` de forma predeterminada
  - la publicación estable de npm puede apuntar explícitamente a `latest` mediante una entrada de flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` aún necesita `NPM_TOKEN` mientras el
    repositorio público mantiene la publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una
    rama de lanzamiento pero el flujo de trabajo se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe superar `preflight_run_id` y
    `validate_run_id` privados de mac exitosos
  - las rutas de publicación reales promocionan artefactos preparados en lugar de reconstruirlos
    otra vez
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales más antiguas con la
  carga estable base
- El preflight de lanzamiento npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y
  los metadatos del paquete estén presentes en el diseño del registro instalado. Un lanzamiento que
  envía cargas de runtime de plugins faltantes falla el verificador postpublish y
  no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del paquete npm en
  el tarball candidato de actualización, para que el e2e del instalador detecte aumentos accidentales de tamaño
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de temporización de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un diseño de CI obsoleto
- La preparación de lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe mantener un bundle id que no sea de depuración, una URL no vacía de feed de Sparkle
    y un `CFBundleVersion` igual o superior al piso canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Cuadros de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas de prelanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama de movimiento rápido, usa el
helper para que cada flujo de trabajo hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper publica `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo de trabajo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija más nueva de `main`.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo de trabajo `main`
de confianza y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El flujo de trabajo resuelve la ref de destino, despacha `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks` y despacha la E2E
de Telegram de paquete independiente cuando `release_profile=full` con
`rerun_group=all` o cuando se define `npm_telegram_package_spec`. Luego,
`OpenClaw Release Checks` despliega install smoke, comprobaciones de lanzamiento
entre sistemas operativos, cobertura live/E2E de la ruta de lanzamiento de
Docker, Package Acceptance con QA del paquete Telegram, paridad de QA Lab,
Matrix live y Telegram live. Una ejecución completa solo es aceptable cuando el
resumen de `Full Release Validation` muestra `normal_ci` y `release_checks` como
correctos. En modo full/all, el hijo `npm_telegram` también debe ser correcto;
fuera de full/all se omite, salvo que se haya proporcionado un
`npm_telegram_package_spec` publicado. El resumen final del verificador incluye
tablas de trabajos más lentos para cada ejecución hija, para que el gestor de
lanzamientos pueda ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation)
para ver la matriz completa de etapas, los nombres exactos de trabajos del flujo
de trabajo, las diferencias entre los perfiles estable y completo, los
artefactos y los identificadores de reejecución enfocada.
Los flujos de trabajo hijos se despachan desde la ref de confianza que ejecuta
`Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de
destino apunta a una rama o etiqueta de lanzamiento anterior. No hay una entrada
de ref de flujo de trabajo separada para Full Release Validation; elige el arnés
de confianza eligiendo la ref de ejecución del flujo de trabajo. No uses
`--ref main -f ref=<sha>` para obtener prueba de commit exacto en una `main`
móvil; los SHA de commit sin procesar no pueden ser refs de despacho de flujo de
trabajo, así que usa `pnpm ci:full-release --sha <sha>` para crear la rama
temporal fijada.

Usa `release_profile` para seleccionar el alcance live/de proveedores:

- `minimum`: ruta más rápida crítica para lanzamiento de OpenAI/core live y Docker
- `stable`: mínimo más cobertura estable de proveedores/backend para aprobación de lanzamiento
- `full`: estable más cobertura amplia consultiva de proveedores/medios

`OpenClaw Release Checks` usa la ref de flujo de trabajo de confianza para
resolver la ref de destino una vez como `release-package-under-test` y reutiliza
ese artefacto tanto en las comprobaciones Docker de ruta de lanzamiento como en
Package Acceptance. Esto mantiene todos los entornos orientados a paquetes con
los mismos bytes y evita compilaciones repetidas de paquetes. El install smoke
de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando
la variable del repo/org está definida; de lo contrario, `openai/gpt-5.5`,
porque este carril demuestra la instalación del paquete, el onboarding, el
arranque del Gateway y un turno live de agente, en lugar de medir el rendimiento
del modelo predeterminado más lento. La matriz live de proveedores más amplia
sigue siendo el lugar para la cobertura específica de modelos.

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No uses el paraguas completo como primera reejecución después de una corrección
enfocada. Si falla un entorno, usa el flujo de trabajo hijo, el trabajo, el
carril Docker, el perfil de paquete, el proveedor de modelo o el carril de QA
fallido para la siguiente prueba. Ejecuta el paraguas completo de nuevo solo
cuando la corrección haya cambiado la orquestación compartida del lanzamiento o
haya vuelto obsoleta la evidencia anterior de todos los entornos. El verificador
final del paraguas vuelve a comprobar los ids registrados de ejecución de los
flujos de trabajo hijos, así que después de que un flujo de trabajo hijo se
reejecute correctamente, reejecuta solo el trabajo padre fallido
`Verify full validation`.

Para una recuperación acotada, pasa `rerun_group` al paraguas. `all` es la
ejecución real del candidato de lanzamiento, `ci` ejecuta solo el hijo normal de
CI, `plugin-prerelease` ejecuta solo el hijo de Plugin exclusivo de lanzamiento,
`release-checks` ejecuta todos los entornos de lanzamiento, y los grupos de
lanzamiento más estrechos son `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las reejecuciones
enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las
ejecuciones full/all con `release_profile=full` usan el artefacto de paquete de
release-checks.

### Vitest

El entorno de Vitest es el flujo de trabajo hijo `CI` manual. La CI manual omite
intencionalmente el alcance por cambios y fuerza el grafo de pruebas normal para
el candidato de lanzamiento: shards de Linux Node, shards de Plugins incluidos,
contratos de canales, compatibilidad con Node 22, `check`, `check-additional`,
build smoke, comprobaciones de docs, Skills de Python, Windows, macOS, Android y
Control UI i18n.

Usa este entorno para responder “¿el árbol fuente pasó la suite completa normal
de pruebas?”. No es lo mismo que la validación de producto de ruta de
lanzamiento. Evidencia que conviene conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución de `CI` despachada
- ejecución de `CI` en verde en el SHA de destino exacto
- nombres de shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesita CI normal
determinista, pero no los entornos Docker, QA Lab, live, entre sistemas
operativos ni de paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

El entorno Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo
`install-smoke` en modo lanzamiento. Valida el candidato de lanzamiento mediante
entornos Docker empaquetados en lugar de solo pruebas a nivel de fuente.

La cobertura Docker de lanzamiento incluye:

- install smoke completo con el smoke de instalación global lenta de Bun habilitado
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA de destino, con trabajos smoke de QR, raíz/Gateway e instalador/Bun ejecutándose como shards install-smoke separados
- carriles E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- carriles divididos de instalación/desinstalación de Plugin incluido
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites de proveedores live/E2E y cobertura de modelos live de Docker cuando las comprobaciones de lanzamiento incluyen suites live

Usa artefactos de Docker antes de reejecutar. El planificador de ruta de
lanzamiento sube `.artifacts/docker-tests/` con registros de carril,
`summary.json`, `failures.json`, tiempos de fase, JSON del plan del planificador
y comandos de reejecución. Para una recuperación enfocada, usa
`docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en
lugar de reejecutar todos los fragmentos de lanzamiento. Los comandos de
reejecución generados incluyen `package_artifact_run_id` previo y entradas de
imagen Docker preparada cuando están disponibles, para que un carril fallido
pueda reutilizar el mismo tarball y las imágenes de GHCR.

### QA Lab

El entorno QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta
de lanzamiento de comportamiento agéntico y nivel de canal, separada de Vitest y
de la mecánica de paquetes de Docker.

La cobertura de QA Lab de lanzamiento incluye:

- puerta de paridad mock que compara el carril candidato de OpenAI con la línea base Opus 4.6 usando el paquete de paridad agéntica
- perfil rápido de QA live de Matrix usando el entorno `qa-live-shared`
- carril QA live de Telegram usando leases de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa este entorno para responder “¿el lanzamiento se comporta correctamente en
escenarios de QA y flujos de canales live?”. Conserva las URL de artefactos de
los carriles de paridad, Matrix y Telegram al aprobar el lanzamiento. La
cobertura completa de Matrix sigue disponible como una ejecución manual
fragmentada de QA-Lab, no como el carril crítico para lanzamiento
predeterminado.

### Paquete

El entorno Package es la puerta del producto instalable. Está respaldado por
`Package Acceptance` y el resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida el
inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene
la ref del arnés del flujo de trabajo separada de la ref fuente del paquete.

Fuentes de candidatos compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo de `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de lanzamiento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` y
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración,
actualización, limpieza de dependencias obsoletas de Plugin, fixtures offline de
Plugin, actualización de Plugin y QA del paquete Telegram contra el mismo
tarball resuelto. Es el reemplazo nativo de GitHub para la mayor parte de la
cobertura de paquete/actualización que antes requería Parallels. Las
comprobaciones de lanzamiento entre sistemas operativos siguen importando para
onboarding, instalador y comportamiento de plataforma específicos del sistema
operativo, pero la validación de producto de paquete/actualización debe preferir
Package Acceptance.

La lista de comprobación canónica para validación de actualizaciones y Plugins
es [Probar actualizaciones y Plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué carril local, Docker, Package Acceptance o de release-check prueba
una instalación/actualización de Plugin, limpieza de doctor o cambio de
migración de paquete publicado. La migración exhaustiva de actualización
publicada desde todos los paquetes estables `2026.4.23+` es un flujo de trabajo
manual `Update Migration` separado, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionalmente limitada en
el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad
para brechas de metadatos ya publicadas en npm: entradas privadas de inventario
QA ausentes en el tarball, falta de `gateway install --wrapper`, falta de
archivos de parche en el fixture de git derivado del tarball, falta de
`update.channel` persistido, ubicaciones heredadas de registros de instalación
de Plugin, falta de persistencia de registros de instalación del marketplace y
migración de metadatos de configuración durante `plugins update`. El paquete
publicado `2026.4.26` puede advertir por archivos de marca de metadatos de build
local que ya se habían distribuido. Los paquetes posteriores deben cumplir los
contratos modernos de paquete; esas mismas brechas hacen fallar la validación de
lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta del
lanzamiento sea sobre un paquete instalable real:

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

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red de Gateway y recarga de configuración
- `package`: contratos de paquete de instalación/actualización/Plugin sin ClawHub live; este es el valor predeterminado de release-check
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
- `full`: fragmentos Docker de ruta de lanzamiento con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para reejecuciones enfocadas

Para la prueba de Telegram candidata a paquete, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el
tarball `package-under-test` resuelto al carril de Telegram; el flujo de trabajo
independiente de Telegram aún acepta una especificación de npm publicada para
comprobaciones posteriores a la publicación.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de
  commit completo de 40 caracteres de la rama del flujo de trabajo actual para
  una comprobación preliminar solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución preliminar correcta
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo que se debe validar. Las comprobaciones
  que llevan secretos requieren que se pueda acceder al commit resuelto desde una rama o
  etiqueta de lanzamiento de OpenClaw.

Reglas:

- Las etiquetas estables y de corrección pueden publicar en `beta` o `latest`
- Las etiquetas de prelanzamiento beta solo pueden publicar en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la comprobación preliminar;
  el flujo de trabajo verifica esos metadatos antes de que la publicación continúe

## Secuencia de lanzamiento estable de npm

Al preparar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo de la rama del flujo de trabajo
     actual para una prueba en seco solo de validación del flujo de trabajo preliminar
2. Elige `npm_dist_tag=beta` para el flujo normal de beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de
   commit completo cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab,
   Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la referencia de lanzamiento en su lugar
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
7. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir de inmediato la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización
   programada de autocorrección mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque aún
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene una publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de
1Password CLI (`op`) solo dentro de una sesión dedicada de tmux. No llames a `op`
directamente desde la shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
las alertas y el manejo de OTP sean observables y evita alertas repetidas del host.

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

Los mantenedores usan la documentación privada de lanzamientos en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
