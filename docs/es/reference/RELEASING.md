---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de lanzamiento o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de las versiones
summary: Carriles de lanzamiento, lista de verificación del operador, cajas de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-05-05T01:48:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales de lanzamiento públicos:

- stable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa el lanzamiento estable actual promocionado en npm
- `beta` significa el objetivo de instalación beta actual
- Los lanzamientos estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promocionar más tarde una compilación beta revisada
- Cada lanzamiento estable de OpenClaw entrega el paquete npm y la app de macOS juntos;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, con
  la compilación/firma/notarización de la app para Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamiento

- Los lanzamientos avanzan primero por beta
- Estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente crean lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir del `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación es
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de etiquetas dist-tag y los detalles de reversión de emergencia permanecen en
el runbook de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae los últimos cambios, confirma que el commit objetivo se haya enviado,
   y confirma que la CI del `main` actual esté lo bastante verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo y vuelve a hacer rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la
   compatibilidad caducada solo cuando la ruta de actualización siga cubierta, o registra por qué se
   conserva intencionadamente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas trabajo normal de lanzamiento
   directamente en `main`.
5. Actualiza cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes de Plugin publicables compartan la versión de lanzamiento
   y los metadatos de compatibilidad, luego ejecuta la preflight local determinista:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento solo para validación
   preflight. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas de prelanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA de commit completo. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo,
   canal, job de workflow, perfil de paquete, proveedor o lista de permitidos de modelos fallidos más pequeños que
   demuestren la corrección. Vuelve a ejecutar todo el paraguas solo cuando la superficie cambiada deje
   obsoleta la evidencia previa.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   publica primero todos los paquetes de Plugin publicables en npm, publica el mismo
   conjunto en ClawHub en segundo lugar como tarballs de npm-pack de ClawPack, y luego promociona el
   artefacto preflight npm de OpenClaw preparado con la etiqueta dist-tag correspondiente. Después de
   publicar, ejecuta la aceptación de paquete posterior a la publicación contra el paquete
   `openclaw@YYYY.M.D-beta.N` u `openclaw@beta` publicado. Si un prelanzamiento enviado o publicado necesita una corrección,
   crea el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el prelanzamiento anterior.
10. Para estable, continúa solo después de que la beta revisada o el candidato de lanzamiento tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto preflight exitoso mediante
    `preflight_run_id`; la preparación del lanzamiento estable para macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E opcional de
    Telegram con npm publicado independiente cuando necesites prueba del canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, las notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Preflight de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa al lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa al lanzamiento para que las comprobaciones más amplias de ciclos de
  importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados
  `dist/*` y el paquete de Control UI existan para el paso de validación
  del paquete
- Ejecuta `pnpm plugins:sync` después del incremento de versión raíz y antes de etiquetar. Actualiza las versiones de paquetes de plugins publicables, los metadatos de compatibilidad
  peer/API de OpenClaw, los metadatos de compilación y los stubs de changelog de plugins para que coincidan con la versión de lanzamiento
  principal. `pnpm plugins:sync:check` es la guarda de lanzamiento no mutante;
  el flujo de publicación falla antes de cualquier mutación del registro si se
  olvidó este paso.
- Ejecuta el flujo manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todas las cajas de pruebas previas al lanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y canales de Telegram. Las ejecuciones estables/predeterminadas
  mantienen el soak exhaustivo live/E2E y de ruta de lanzamiento Docker detrás de
  `run_release_soak=true`; `release_profile=full` fuerza la activación del soak. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta E2E de Telegram del paquete
  contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento.
  Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo
  E2E de Telegram también deba probar el paquete npm publicado. Proporciona
  `package_acceptance_package_spec` después de publicar cuando Package Acceptance
  deba ejecutar su matriz de paquete/actualización contra el paquete npm enviado en lugar
  del artefacto compilado desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba demostrar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo manual `Package Acceptance` cuando quieras pruebas de canal lateral
  para un candidato de paquete mientras el trabajo de lanzamiento continúa. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 requerido; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El flujo resuelve el candidato a
  `package-under-test`, reutiliza el programador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  canales Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: canales de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: canales nativos de artefacto de paquete/actualización/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta el flujo manual `CI` directamente cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Linux Node, los shards de plugins empaquetados, los contratos de canal,
  la compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación,
  comprobaciones de docs, Skills de Python, Windows, macOS, Android y los canales de i18n
  de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de trazas
  exportados, los atributos acotados y la redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro recopilador externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que
  exista la etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento y el
  `preflight_run_id` exitoso de npm de OpenClaw, y mantén el alcance de publicación de plugins predeterminado
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El
  flujo serializa la publicación npm de plugins, la publicación ClawHub de plugins y la publicación npm de OpenClaw
  para que el paquete principal no se publique antes que sus
  plugins externalizados.
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el canal de paridad mock de QA Lab más el perfil
  live rápido de Matrix y el canal de QA de Telegram antes de la aprobación del lanzamiento. Los canales live
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI. Ejecuta el flujo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte,
  medios y E2EE de Matrix en paralelo.
- La validación en tiempo de ejecución de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  flujo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y enfocada en artefactos, mientras las comprobaciones live más lentas permanecen en su
  propio canal para que no retrasen ni bloqueen la publicación
- Las comprobaciones de lanzamiento que contienen secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de flujo `main`/release para que la lógica de los flujos y los
  secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre que
  el commit resuelto sea alcanzable desde una rama de OpenClaw o etiqueta de lanzamiento
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual
  de 40 caracteres del commit de la rama del flujo sin requerir una etiqueta enviada
- Esa ruta de SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el flujo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos mantienen la ruta real de publicación y promoción en runners alojados en GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes
  de Blacksmith
- Ese flujo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa de lanzamiento npm ya no espera el canal separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding del paquete instalado, la configuración de Telegram y E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales arrendadas de Telegram.
  Los mantenedores locales pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta validación de actualización npm/fresh-target de Parallels, despacha `NPM Telegram Beta E2E`, consulta la ejecución exacta del flujo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento de mantenedores ahora usa verificación previa y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` de npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución de verificación previa exitosa
  - los lanzamientos npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante la entrada del flujo
  - la mutación de dist-tag de npm basada en tokens ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` sigue necesitando `NPM_TOKEN`, mientras que el
    repositorio público conserva publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una
    rama de lanzamiento pero el flujo se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación real privada de mac debe pasar los
    `preflight_run_id` y `validate_run_id` privados de mac exitosos
  - las rutas reales de publicación promocionan artefactos preparados en lugar de reconstruirlos
    otra vez
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la
  carga estable base
- La verificación previa de lanzamiento npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía `dist/control-ui/assets/`
  para no volver a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y
  los metadatos de paquetes estén presentes en el diseño del registro instalado. Un lanzamiento que
  envía cargas útiles de runtime de plugins faltantes falla el verificador postpublish y
  no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también impone el presupuesto de `unpackedSize` del paquete npm sobre
  el tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador de
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un diseño de CI obsoleto
- La preparación del lanzamiento estable de macOS también incluye las superficies de actualización:
  - el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe conservar un id de paquete no debug, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle
    para esa versión de lanzamiento

## Cajas de pruebas de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama que avanza rápido, usa el
helper para que cada flujo hijo se ejecute desde una rama temporal fijada al SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente
una ejecución hija de `main` más nueva.

Para la validación de ramas o etiquetas de lanzamiento, ejecútala desde la referencia de flujo `main`
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

El flujo de trabajo resuelve la ref de destino, despacha manualmente `CI` con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto padre `release-package-under-test` para las comprobaciones orientadas
a paquetes y despacha el E2E independiente del paquete Telegram cuando
`release_profile=full` con `rerun_group=all` o cuando se define
`npm_telegram_package_spec`. Luego `OpenClaw Release
Checks` despliega smoke de instalación, comprobaciones de release entre
sistemas operativos, cobertura live/E2E de la ruta de release Docker cuando el
soak está habilitado, Package Acceptance con QA del paquete Telegram, paridad de
QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa solo es aceptable cuando el
resumen de `Full Release Validation`
muestra `normal_ci` y `release_checks` como correctos. En modo full/all,
el hijo `npm_telegram` también debe ser correcto; fuera de full/all se omite
salvo que se haya proporcionado un `npm_telegram_package_spec` publicado. El resumen final
del verificador incluye tablas de trabajos más lentos para cada ejecución hija, para que el gestor de release pueda ver la ruta crítica actual sin descargar logs.
Consulta [Validación completa de release](/es/reference/full-release-validation) para la
matriz completa de etapas, los nombres exactos de trabajos de flujo de trabajo, las diferencias
entre los perfiles estable y completo, los artefactos y los identificadores de repetición enfocados.
Los flujos de trabajo hijos se despachan desde la ref de confianza que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una
rama o etiqueta de release anterior. No hay una entrada independiente de ref de flujo de trabajo de Full Release Validation; elige el arnés de confianza eligiendo la ref de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para prueba exacta de commit en `main` móvil;
los SHA de commit sin procesar no pueden ser refs de despacho de flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: la ruta live y Docker crítica de release más rápida para OpenAI/núcleo
- `stable`: minimum más cobertura estable de proveedores/backends para la aprobación de release
- `full`: stable más cobertura amplia de proveedores/medios consultivos

Usa `run_release_soak=true` con `stable` cuando los lanes bloqueantes de release estén
en verde y quieras el barrido exhaustivo live/E2E, de ruta de release Docker y de
supervivientes de actualización desde 2026.4.23 antes de la promoción. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa la ref de flujo de trabajo de confianza para resolver la ref de destino
una vez como `release-package-under-test` y reutiliza ese artefacto en comprobaciones entre sistemas operativos,
Package Acceptance y Docker de ruta de release cuando se ejecuta el soak. Esto mantiene
todas las máquinas orientadas a paquetes en los mismos bytes y evita compilaciones repetidas de paquetes.
El smoke de instalación OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/org está definida; si no, `openai/gpt-5.4`, porque este lane está
probando la instalación del paquete, el onboarding, el arranque del Gateway y un turno de agente en vivo,
no midiendo el modelo predeterminado más lento. La matriz live más amplia de proveedores
sigue siendo el lugar para la cobertura específica de modelos.

Usa estas variantes según la etapa de release:

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

No uses el paraguas completo como la primera repetición tras una corrección enfocada. Si falla una máquina,
usa el flujo de trabajo hijo, trabajo, lane Docker, perfil de paquete, proveedor de modelo
o lane de QA fallido para la siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando
la corrección haya cambiado la orquestación compartida de release o haya vuelto obsoleta la evidencia anterior de todas las máquinas. El verificador final del paraguas vuelve a comprobar los ids registrados de ejecución del flujo de trabajo hijo, así que después de que un flujo de trabajo hijo se repita correctamente, repite solo el trabajo padre fallido
`Verify full validation`.

Para una recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
de candidato de release, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease`
ejecuta solo el hijo de Plugin exclusivo de release, `release-checks` ejecuta todas las máquinas de release,
y los grupos de release más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las repeticiones enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all
con `release_profile=full` usan el artefacto de paquete de release-checks. Las repeticiones enfocadas
entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u
otro filtro de sistema operativo/suite. Los fallos de QA de release-check son consultivos; un fallo solo de QA
no bloquea la validación de release.

### Vitest

La máquina Vitest es el flujo de trabajo hijo manual `CI`. La CI manual omite intencionadamente
el alcance por cambios y fuerza el grafo de pruebas normal para el candidato de release:
shards de Linux Node, shards de plugins incluidos, contratos de canales, compatibilidad con Node 22,
`check`, `check-additional`, smoke de build, comprobaciones de docs, Skills de Python,
Windows, macOS, Android e i18n de Control UI.

Usa esta máquina para responder "¿pasó el árbol de código fuente el conjunto completo normal de pruebas?"
No es lo mismo que la validación de producto de ruta de release. Evidencia que conservar:

- resumen de `Full Release Validation` que muestre la URL de la ejecución despachada de `CI`
- ejecución de `CI` en verde en el SHA exacto de destino
- nombres de shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando la release necesita CI normal determinista, pero
no las máquinas Docker, QA Lab, live, entre sistemas operativos ni de paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La máquina Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, más el flujo de trabajo
`install-smoke` en modo release. Valida el candidato de release mediante entornos Docker
empaquetados en vez de solo pruebas a nivel de fuente.

La cobertura Docker de release incluye:

- smoke completo de instalación con el smoke lento de instalación global de Bun habilitado
- preparación/reutilización de imagen smoke de Dockerfile raíz por SHA de destino, con trabajos de QR,
  raíz/Gateway e instalador/Bun smoke ejecutándose como shards independientes de install-smoke
- lanes E2E del repositorio
- fragmentos Docker de ruta de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicite
- lanes divididos de instalación/desinstalación de plugins incluidos
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites live/E2E de proveedores y cobertura de modelos live Docker cuando las comprobaciones de release
  incluyen suites live

Usa los artefactos de Docker antes de repetir. El programador de ruta de release sube
`.artifacts/docker-tests/` con logs de lanes, `summary.json`, `failures.json`,
tiempos de fases, JSON del plan del programador y comandos de repetición. Para recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en vez de
repetir todos los fragmentos de release. Los comandos de repetición generados incluyen el
`package_artifact_run_id` anterior y entradas de imagen Docker preparada cuando estén disponibles, para que un
lane fallido pueda reutilizar el mismo tarball e imágenes GHCR.

### QA Lab

La máquina QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de release de
comportamiento agéntico y a nivel de canal, separada de Vitest y de la mecánica de paquetes Docker.

La cobertura QA Lab de release incluye:

- lane de paridad mock que compara el lane candidato de OpenAI contra la línea base Opus 4.6
  usando el pack de paridad agéntica
- perfil rápido de QA Matrix en vivo usando el entorno `qa-live-shared`
- lane de QA Telegram en vivo usando leases de credenciales CI de Convex
- `pnpm qa:otel:smoke` cuando la telemetría de release necesita prueba local explícita

Usa esta máquina para responder "¿se comporta correctamente la release en escenarios de QA y
flujos de canales en vivo?" Conserva las URL de artefactos de los lanes de paridad, Matrix y Telegram
al aprobar la release. La cobertura completa de Matrix sigue disponible como una ejecución manual
fragmentada de QA-Lab en vez del lane crítico de release predeterminado.

### Paquete

La máquina Package es la puerta de producto instalable. Está respaldada por
`Package Acceptance` y el resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene la
ref del arnés de flujo de trabajo separada de la ref de origen del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo `package_ref` de confianza
  con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de release preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, actualización, limpieza
de dependencias obsoletas de plugins, fixtures de plugins offline, actualización de plugins y QA del paquete Telegram
contra el mismo tarball resuelto. Las comprobaciones bloqueantes de release usan la
línea base predeterminada del último paquete publicado; `run_release_soak=true` o
`release_profile=full` amplía a todas las líneas base estables publicadas en npm desde
`2026.4.23` hasta `latest`, más fixtures de incidencias reportadas. Usa
Package Acceptance con `source=npm` para un candidato ya distribuido, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes de
publicar. Es el reemplazo nativo de GitHub
para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería
Parallels. Las comprobaciones de release entre sistemas operativos siguen siendo importantes para onboarding,
instalador y comportamiento de plataforma específicos del sistema operativo, pero la validación de producto de paquete/actualización debe
preferir Package Acceptance.

La lista de comprobación canónica para validación de actualizaciones y plugins es
[Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué lane local, Docker, Package Acceptance o release-checks prueba una
instalación/actualización de Plugin, limpieza de doctor o cambio de migración de paquete publicado.
La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es
un flujo de trabajo manual independiente `Update Migration`, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionadamente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para lagunas de metadatos ya publicadas
en npm: entradas privadas de inventario de QA ausentes del tarball, ausencia de
`gateway install --wrapper`, ausencia de archivos de parche en el fixture git derivado del tarball,
ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins,
ausencia de persistencia de registros de instalación de marketplace y migración de metadatos de configuración
durante `plugins update`. El paquete publicado `2026.4.26` puede advertir
por archivos locales de sello de metadatos de build que ya se distribuyeron. Los paquetes posteriores
deben satisfacer los contratos modernos de paquetes; esas mismas lagunas hacen fallar la
validación de release.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de release trate sobre un
paquete instalable real:

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

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red del gateway y
  recarga de configuración
- `package`: contratos de instalación/actualización/paquete de plugin sin ClawHub en vivo; este es el valor
  predeterminado de la comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagentes, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram de un paquete candidato, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball
resuelto de `package-under-test` al carril de Telegram; el flujo de trabajo independiente de
Telegram todavía acepta una especificación publicada de npm para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamientos

`OpenClaw Release Publish` es el punto de entrada normal de publicación con mutaciones. Este
orquesta los flujos de trabajo de publicador confiable en el orden que requiere el lanzamiento:

1. Extraer la etiqueta de lanzamiento y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de lanzamiento, la etiqueta dist-tag de npm y
   el `preflight_run_id` guardado.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publicación estable con la etiqueta dist-tag beta predeterminada:

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
solo para trabajos enfocados de reparación o republicación. Para una reparación de un plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha directamente el flujo de trabajo hijo cuando el
paquete de OpenClaw no deba publicarse.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit completo
  actual de 40 caracteres de la rama de flujo de trabajo para una preflight solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución de preflight correcta
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por operador:

- `tag`: etiqueta de lanzamiento obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución de preflight correcto de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta de destino de npm para el paquete de OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquete `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; configúralo como `false` solo al usar el
  flujo de trabajo como orquestador de reparación solo de plugins

`OpenClaw Release Checks` acepta estas entradas controladas por operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones que llevan secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  una etiqueta de lanzamiento.
- `run_release_soak`: opta por una prueba soak exhaustiva en vivo/E2E, ruta de lanzamiento de Docker y
  supervivencia de actualizaciones desde todas las versiones previas en comprobaciones de lanzamiento estable/predeterminado. Se fuerza
  con `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la preflight;
  el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento estable de npm

Al preparar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo actual de la rama de flujo de trabajo
     para una ejecución de ensayo solo de validación del flujo de trabajo de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal de beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, etiqueta de lanzamiento o SHA de commit completo
   cuando quieras CI normal más caché de prompts en vivo, Docker, QA Lab,
   Matrix y cobertura de Telegram desde un flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la referencia de lanzamiento
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el lanzamiento quedó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autocorrección mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la
CLI de 1Password (`op`) solo dentro de una sesión dedicada de tmux. No llames a `op`
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
