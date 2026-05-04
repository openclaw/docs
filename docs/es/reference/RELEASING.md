---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de lanzamiento o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-05-04T07:04:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres vías de lanzamiento públicas:

- stable: lanzamientos etiquetados que publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que publican en npm `beta`
- dev: la cabeza móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No agregues ceros a la izquierda al mes ni al día
- `latest` significa el lanzamiento estable actual promovido en npm
- `beta` significa el destino actual de instalación beta
- Los lanzamientos estables y de corrección estable publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más adelante una compilación beta revisada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, con
  la compilación/firma/notarización de la app de Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamiento

- Los lanzamientos avanzan primero por beta
- Estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente cortan lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir del `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores cortan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, las aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el manual de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo más reciente, confirma que el commit de destino se haya enviado
   y confirma que el CI del `main` actual esté lo suficientemente verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, confírmala, envíala y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la compatibilidad expirada
   solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva
   intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes Plugin publicables compartan la versión de lanzamiento
   y los metadatos de compatibilidad, y luego ejecuta la preflight determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento solo para la validación
   preflight. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, la etiqueta o el SHA completo del commit. Este es el único punto de entrada manual
   para los cuatro grandes entornos de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, vía,
   job de workflow, perfil de paquete, proveedor o allowlist de modelo fallido más pequeño que
   demuestre la corrección. Vuelve a ejecutar todo el paraguas solo cuando la superficie cambiada vuelva obsoleta
   la evidencia anterior.
9. Para beta, etiqueta `vYYYY.M.D-beta.N` y luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   publica primero en npm todos los paquetes Plugin publicables, publica el mismo
   conjunto en ClawHub en segundo lugar como tarballs npm-pack de ClawPack, y luego promueve el
   artefacto preflight npm preparado de OpenClaw con el dist-tag correspondiente. Después de
   publicar, ejecuta la aceptación de paquete posterior a la publicación
   contra el paquete `openclaw@YYYY.M.D-beta.N` u
   `openclaw@beta` publicado. Si un prelanzamiento enviado o publicado necesita una corrección,
   corta el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el
   prelanzamiento anterior.
10. Para estable, continúa solo después de que la beta revisada o el candidato de lanzamiento tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto preflight exitoso mediante
    `preflight_run_id`; la preparación del lanzamiento estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador npm posterior a la publicación, el E2E opcional de Telegram
    con npm publicado independiente cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, las notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Preflight de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa de la versión para que el TypeScript de pruebas siga cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa de la versión para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de versión esperados `dist/*` y el paquete de la UI de Control existan para el paso de validación del paquete
- Ejecuta `pnpm plugins:sync` después del incremento de versión raíz y antes de etiquetar. Actualiza las versiones de paquetes de plugins publicables, los metadatos de compatibilidad de pares/API de OpenClaw, los metadatos de compilación y los stubs de changelog de plugins para que coincidan con la versión core. `pnpm plugins:sync:check` es la guarda de versión no mutante; el flujo de publicación falla antes de cualquier mutación del registro si se olvidó este paso.
- Ejecuta el workflow manual `Full Release Validation` antes de aprobar la versión para iniciar todos los bancos de pruebas previos a la versión desde un único punto de entrada. Acepta una rama, etiqueta o SHA completo de commit, despacha `CI` manual y despacha `OpenClaw Release Checks` para install smoke, aceptación de paquetes, suites de ruta de publicación de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y canales de Telegram. Con `release_profile=full` y `rerun_group=all`, también ejecuta Telegram E2E de paquete contra el artefacto `release-package-under-test` de las comprobaciones de versión. Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo Telegram E2E también deba probar el paquete npm publicado. Proporciona `package_acceptance_package_spec` después de publicar cuando Package Acceptance deba ejecutar su matriz de paquetes/actualizaciones contra el paquete npm enviado en lugar del artefacto compilado desde el SHA. Proporciona `evidence_package_spec` cuando el informe privado de evidencia deba probar que la validación coincide con un paquete npm publicado sin forzar Telegram E2E. Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el workflow manual `Package Acceptance` cuando quieras una prueba de canal lateral para un candidato de paquete mientras continúa el trabajo de versión. Usa `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión exacta de publicación; `source=ref` para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés `workflow_ref` actual; `source=url` para un tarball HTTPS con un SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de GitHub Actions. El workflow resuelve el candidato a `package-under-test`, reutiliza el programador de publicación Docker E2E contra ese tarball y puede ejecutar QA de Telegram contra el mismo tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los canales Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: canales de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: canales nativos de artefacto para paquete/actualización/plugin sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de publicación Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta directamente el workflow manual `CI` cuando solo necesites cobertura completa de CI normal para el candidato de versión. Los despachos manuales de CI omiten el alcance por cambios y fuerzan los shards Linux Node, shards de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de docs, Skills de Python, Windows, macOS, Android y canales de i18n de la UI de Control.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de versión. Ejercita QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de trazas exportadas, los atributos acotados y la redacción de contenido/identificadores sin requerir Opik, Langfuse u otro recopilador externo.
- Ejecuta `pnpm release:check` antes de cada versión etiquetada
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que exista la etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una etiqueta alcanzable desde main), pasa la etiqueta de versión y el `preflight_run_id` exitoso de npm de OpenClaw, y conserva el alcance predeterminado de publicación de plugins `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El workflow serializa la publicación npm de plugins, la publicación en ClawHub de plugins y la publicación npm de OpenClaw para que el paquete core no se publique antes que sus plugins externalizados.
- Las comprobaciones de versión ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el canal de paridad mock de QA Lab, además del perfil rápido live de Matrix y el canal de QA de Telegram antes de aprobar la versión. Los canales live usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de CI de Convex. Ejecuta el workflow manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte, medios y E2EE de Matrix en paralelo.
- La validación de instalación y actualización runtime entre sistemas operativos forma parte de los workflows públicos `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al workflow reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantiene la ruta real de publicación npm corta, determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su propio canal para no atascar ni bloquear la publicación
- Las comprobaciones de versión con secretos deben despacharse mediante `Full Release Validation` o desde la referencia de workflow `main`/release para que la lógica del workflow y los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre que el commit resuelto sea alcanzable desde una rama o etiqueta de versión de OpenClaw
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres del commit de la rama del workflow sin requerir una etiqueta subida
- Esa ruta de SHA es solo de validación y no se puede promover a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real aún requiere una etiqueta de versión real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners hospedados por GitHub, mientras la ruta de validación no mutante puede usar los runners Linux más grandes de Blacksmith
- Ese workflow ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa de publicación npm ya no espera al canal separado de comprobaciones de versión
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado en un prefijo temporal nuevo
- Después de publicar una beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar el onboarding del paquete instalado, la configuración de Telegram y Telegram E2E real contra el paquete npm publicado usando el pool compartido de credenciales arrendadas de Telegram. Los mantenedores pueden omitir las variables de Convex en ejecuciones locales puntuales y pasar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta validación de actualización npm/fresh-target de Parallels, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del workflow, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta en cada merge.
- La automatización de versiones de mantenedores ahora usa verificación previa y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` de npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o `release/YYYY.M.D` que la ejecución de verificación previa exitosa
  - las versiones npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante una entrada de workflow
  - la mutación basada en token de dist-tag de npm ahora vive en `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el repositorio público mantiene la publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una rama de versión pero el workflow se despacha desde `main`, establece `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe pasar un `preflight_run_id` y un `validate_run_id` privados de mac exitosos
  - las rutas de publicación reales promueven artefactos preparados en lugar de reconstruirlos otra vez
- Para versiones estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización de prefijo temporal desde `YYYY.M.D` a `YYYY.M.D-N` para que las correcciones de versión no puedan dejar silenciosamente instalaciones globales antiguas en la carga base estable
- La verificación previa de publicación npm falla cerrada salvo que el tarball incluya tanto `dist/control-ui/index.html` como una carga no vacía `dist/control-ui/assets/`, para no volver a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los entrypoints de plugins publicados y los metadatos de paquete estén presentes en el diseño de registro instalado. Una versión que envía cargas runtime de plugins faltantes falla el verificador postpublish y no se puede promover a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del pack npm sobre el tarball candidato de actualización, de modo que installer e2e detecta el aumento accidental del tamaño del paquete antes de la ruta de publicación de versión
- Si el trabajo de versión tocó la planificación de CI, los manifiestos de timing de extensiones o las matrices de pruebas de extensiones, regenera y revisa las salidas de matriz `plugin-prerelease-extension-shard`, propiedad del planificador, desde `.github/workflows/plugin-prerelease.yml` antes de aprobar, para que las notas de versión no describan un diseño de CI obsoleto
- La preparación de una versión estable de macOS también incluye las superficies del actualizador:
  - la release de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe conservar un bundle id no debug, una URL de feed de Sparkle no vacía y un `CFBundleVersion` igual o superior al piso canónico de compilación de Sparkle para esa versión de release

## Bancos de pruebas de versión

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas a la versión desde un único punto de entrada. Para una prueba de commit fijado en una rama que avanza rápido, usa el helper para que cada workflow hijo se ejecute desde una rama temporal fijada al SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper sube `release-ci/<sha>-...`, despacha `Full Release Validation` desde esa rama con `ref=<sha>`, verifica que cada `headSha` de workflow hijo coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una ejecución hija de `main` más nueva.

Para validar una rama o etiqueta de versión, ejecútalo desde la referencia de workflow `main` de confianza y pasa la rama o etiqueta de versión como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El flujo de trabajo resuelve la ref de destino, despacha manualmente `CI` con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto padre `release-package-under-test` para las comprobaciones orientadas
a paquetes, y despacha el E2E independiente del paquete de Telegram cuando
`release_profile=full` con `rerun_group=all` o cuando se establece
`npm_telegram_package_spec`. Luego `OpenClaw Release
Checks` despliega comprobaciones de humo de instalación, comprobaciones de
lanzamiento entre sistemas operativos, cobertura de ruta de lanzamiento de
Docker en vivo/E2E, Aceptación de paquetes con QA del paquete de Telegram, paridad
de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa solo es
aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci` y
`release_checks` como correctos. En modo full/all, el hijo `npm_telegram` también
debe ser correcto; fuera de full/all se omite, salvo que se haya proporcionado
un `npm_telegram_package_spec` publicado. El resumen final del verificador incluye
tablas de trabajos más lentos para cada ejecución hija, para que el responsable
del lanzamiento pueda ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la
matriz completa de etapas, los nombres exactos de trabajos de flujo de trabajo,
las diferencias entre los perfiles estable y completo, los artefactos y los
identificadores de reejecución enfocados.
Los flujos de trabajo hijos se despachan desde la ref de confianza que ejecuta
`Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de
destino apunta a una rama o etiqueta de lanzamiento anterior. No hay una entrada
separada de ref de flujo de trabajo de Full Release Validation; elige el arnés de
confianza eligiendo la ref de ejecución del flujo de trabajo. No uses
`--ref main -f ref=<sha>` para prueba de confirmación exacta en un `main` móvil;
los SHA de confirmación sin procesar no pueden ser refs de despacho de flujo de
trabajo, así que usa `pnpm ci:full-release --sha <sha>` para crear la rama
temporal fijada.

Usa `release_profile` para seleccionar la amplitud en vivo/proveedor:

- `minimum`: la ruta en vivo y de Docker crítica para lanzamiento más rápida de OpenAI/núcleo
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de lanzamiento
- `full`: stable más cobertura amplia de proveedor/medios consultiva

`OpenClaw Release Checks` usa la ref de flujo de trabajo de confianza para
resolver la ref de destino una vez como `release-package-under-test` y reutiliza
ese artefacto tanto en las comprobaciones de Docker de ruta de lanzamiento como
en Aceptación de paquetes. Esto mantiene todas las cajas orientadas a paquetes
en los mismos bytes y evita compilaciones repetidas de paquetes. La comprobación
de humo de instalación de OpenAI entre sistemas operativos usa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la variable de repo/org está establecida,
o `openai/gpt-5.4` en caso contrario, porque esta vía prueba la instalación del
paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo,
no evalúa el modelo predeterminado más lento. La matriz más amplia de proveedores
en vivo sigue siendo el lugar para la cobertura específica de modelos.

Usa estas variantes según la etapa de lanzamiento:

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
enfocada. Si una caja falla, usa el flujo de trabajo hijo fallido, el trabajo, la
vía de Docker, el perfil de paquete, el proveedor de modelo o la vía de QA para
la siguiente prueba. Vuelve a ejecutar el paraguas completo solo cuando la
corrección haya cambiado la orquestación compartida de lanzamiento o haya dejado
obsoleta la evidencia anterior de todas las cajas. El verificador final del
paraguas vuelve a comprobar los ids registrados de ejecución de flujos de
trabajo hijos, así que después de que un flujo de trabajo hijo se vuelva a
ejecutar correctamente, vuelve a ejecutar solo el trabajo padre fallido
`Verify full validation`.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución
real de candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal,
`plugin-prerelease` ejecuta solo el hijo de Plugin exclusivo de lanzamiento,
`release-checks` ejecuta todas las cajas de lanzamiento, y los grupos de
lanzamiento más estrechos son `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las reejecuciones
enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las
ejecuciones full/all con `release_profile=full` usan el artefacto de paquete de
release-checks.

### Vitest

La caja de Vitest es el flujo de trabajo hijo manual `CI`. La CI manual omite
intencionalmente el alcance por cambios y fuerza el grafo de pruebas normal para
el candidato de lanzamiento: shards de Linux Node, shards de Plugins incluidos,
contratos de canales, compatibilidad con Node 22, `check`, `check-additional`,
comprobación de humo de build, comprobaciones de docs, Skills de Python, Windows,
macOS, Android e i18n de Control UI.

Usa esta caja para responder “¿pasó el árbol de fuentes el conjunto completo de
pruebas normales?”. No es lo mismo que la validación de producto de ruta de
lanzamiento. Evidencia que se debe conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` en verde en el SHA de destino exacto
- nombres de shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta la CI manual directamente solo cuando el lanzamiento necesita CI normal
determinista pero no las cajas de Docker, QA Lab, en vivo, entre sistemas
operativos o de paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La caja de Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo
`install-smoke` en modo de lanzamiento. Valida el candidato de lanzamiento a
través de entornos Docker empaquetados en lugar de solo pruebas a nivel de
fuente.

La cobertura de Docker de lanzamiento incluye:

- comprobación de humo de instalación completa con la comprobación de humo lenta de instalación global de Bun habilitada
- preparación/reutilización de la imagen de comprobación de humo del Dockerfile raíz por SHA de destino, con trabajos de QR,
  raíz/Gateway e instalador/Bun ejecutándose como shards separados de install-smoke
- vías E2E del repositorio
- fragmentos de Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- vías divididas de instalación/desinstalación de Plugins incluidos
  `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suites de proveedor en vivo/E2E y cobertura de modelos en vivo de Docker cuando las comprobaciones de lanzamiento
  incluyen suites en vivo

Usa los artefactos de Docker antes de volver a ejecutar. El planificador de ruta
de lanzamiento sube `.artifacts/docker-tests/` con registros de vías,
`summary.json`, `failures.json`, tiempos de fases, JSON del plan del planificador
y comandos de reejecución. Para recuperación enfocada, usa
`docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E en
lugar de volver a ejecutar todos los fragmentos de lanzamiento. Los comandos de
reejecución generados incluyen `package_artifact_run_id` anteriores y entradas
de imágenes Docker preparadas cuando están disponibles, por lo que una vía fallida
puede reutilizar el mismo tarball y las mismas imágenes GHCR.

### QA Lab

La caja QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de
lanzamiento de comportamiento agéntico y a nivel de canal, separada de Vitest y
de la mecánica de paquetes de Docker.

La cobertura de QA Lab de lanzamiento incluye:

- vía de paridad simulada que compara la vía candidata de OpenAI con la línea base de Opus 4.6
  usando el paquete de paridad agéntica
- perfil rápido de QA de Matrix en vivo usando el entorno `qa-live-shared`
- vía de QA de Telegram en vivo usando préstamos de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta caja para responder “¿se comporta correctamente el lanzamiento en
escenarios de QA y flujos de canales en vivo?”. Conserva las URLs de artefactos
para las vías de paridad, Matrix y Telegram al aprobar el lanzamiento. La
cobertura completa de Matrix sigue disponible como ejecución manual fragmentada
de QA-Lab en lugar de la vía crítica de lanzamiento predeterminada.

### Paquete

La caja de paquete es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolutor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolutor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida el
inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene
separada la ref del arnés de flujo de trabajo de la ref de fuente del paquete.

Fuentes de candidatos compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA de confirmación completo de `package_ref` de confianza
  con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Aceptación de paquetes con `source=artifact`,
el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` y
`telegram_mode=mock-openai`. Aceptación de paquetes mantiene migración,
actualización, limpieza de dependencias obsoletas de Plugin, fixtures de Plugin
sin conexión, actualización de Plugin y QA del paquete de Telegram contra el
mismo tarball resuelto. La matriz de actualización cubre todas las líneas base estables publicadas en npm desde `2026.4.23` hasta `latest`; usa
Aceptación de paquetes con `source=npm` para un candidato ya enviado, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes
de publicar. Es el reemplazo nativo de GitHub para la mayor parte de la cobertura
de paquete/actualización que antes requería Parallels. Las comprobaciones de
lanzamiento entre sistemas operativos siguen siendo importantes para la
incorporación, el instalador y el comportamiento de plataforma específicos de
cada sistema operativo, pero la validación de producto de paquete/actualización
debería preferir Aceptación de paquetes.

La lista de comprobación canónica para validación de actualizaciones y Plugins es
[Pruebas de actualizaciones y Plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué vía local, de Docker, de Aceptación de paquetes o de comprobación de
lanzamiento prueba una instalación/actualización de Plugin, una limpieza de
doctor o un cambio de migración de paquete publicado. La migración exhaustiva de
actualización publicada desde cada paquete estable `2026.4.23+` es un flujo de
trabajo manual separado `Update Migration`, no forma parte de Full Release CI.

La flexibilidad heredada de package-acceptance está intencionalmente limitada en
el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad
para brechas de metadatos ya publicadas en npm: entradas de inventario privado de
QA ausentes en el tarball, ausencia de `gateway install --wrapper`, archivos de
parche ausentes en el fixture git derivado del tarball, ausencia de
`update.channel` persistido, ubicaciones heredadas de registros de instalación de
Plugin, ausencia de persistencia de registros de instalación de marketplace y
migración de metadatos de configuración durante `plugins update`. El paquete
publicado `2026.4.26` puede advertir por archivos de marca de metadatos de build
local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos
modernos de paquetes; esas mismas brechas hacen fallar la validación de
lanzamiento.

Usa perfiles más amplios de Aceptación de paquetes cuando la pregunta de
lanzamiento trate de un paquete instalable real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfiles comunes de paquete:

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red de Gateway y
  recarga de configuración
- `package`: contratos de instalación/actualización/paquete de Plugin sin ClawHub en vivo; este es el valor
  predeterminado de comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web
  de OpenAI y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram del paquete candidato, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el
tarball resuelto de `package-under-test` al carril de Telegram; el flujo de trabajo
independiente de Telegram sigue aceptando una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamientos

`OpenClaw Release Publish` es el punto de entrada mutante normal para publicación. 
Orquesta los flujos de trabajo de publicador de confianza en el orden que necesita el lanzamiento:

1. Extrae la etiqueta de lanzamiento y resuelve su SHA de commit.
2. Verifica que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecuta `pnpm plugins:sync:check`.
4. Despacha `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despacha `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despacha `OpenClaw NPM Release` con la etiqueta de lanzamiento, la dist-tag de npm y
   el `preflight_run_id` guardado.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publicación estable a la dist-tag beta predeterminada:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

La promoción estable directamente a `latest` es explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Usa los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release`
solo para trabajos enfocados de reparación o republicación. Para una reparación de Plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha el flujo de trabajo hijo directamente cuando el
paquete de OpenClaw no deba publicarse.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo de 40 caracteres de la rama del flujo de trabajo actual para una preflight
  solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución de preflight correcta
- `npm_dist_tag`: etiqueta de destino npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución de preflight correcta de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta de destino npm para el paquete de OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquete `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo cuando uses el
  flujo de trabajo como orquestador de reparación solo para Plugin

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones con secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  una etiqueta de lanzamiento.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas beta preliminares solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la preflight;
  el flujo de trabajo verifica esos metadatos antes de que continúe la publicación

## Secuencia de lanzamiento estable de npm

Al preparar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo actual de la rama del flujo de trabajo
     para un ensayo solo de validación del flujo de trabajo de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal de beta primero, o `latest` solo
   cuando quieras intencionadamente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de
   commit completo cuando quieras CI normal más caché de prompts en vivo, Docker, QA Lab,
   Matrix y cobertura de Telegram desde un flujo de trabajo manual
4. Si intencionadamente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la referencia de lanzamiento en su lugar
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica Plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta`
   debe seguir de inmediato la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autorreparación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad, porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación npm local, ejecuta cualquier comando de CLI
de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
directamente desde el shell principal del agente; mantenerlo dentro de tmux hace que prompts,
alertas y gestión de OTP sean observables y evita alertas repetidas del host.

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
