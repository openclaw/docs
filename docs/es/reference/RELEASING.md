---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de lanzamiento o de la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-02T21:03:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene cuatro canales públicos de lanzamiento:

- stable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- alpha: etiquetas de prelanzamiento que se publican en npm `alpha`
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento alpha: `YYYY.M.D-alpha.N`
  - Etiqueta de Git: `vYYYY.M.D-alpha.N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa el lanzamiento estable actual promocionado en npm
- `alpha` significa el destino actual de instalación alpha
- `beta` significa el destino actual de instalación beta
- Los lanzamientos estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promocionar más tarde una compilación beta examinada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta de npm/paquete, con
  la compilación/firma/notarización de la app de Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente preparan lanzamientos desde una rama `release/YYYY.M.D` creada
  desde el `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los mantenedores preparan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en
el manual de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo último, confirma que el commit de destino se haya enviado,
   y confirma que el CI actual de `main` esté lo suficientemente en verde para ramificar desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la compatibilidad caducada
   solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva
   intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes de Plugin publicables compartan la versión
   de lanzamiento y los metadatos de compatibilidad, luego ejecuta la verificación previa determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento para una verificación previa solo de validación.
   Guarda el `preflight_run_id` correcto.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, la etiqueta o el SHA completo del commit. Este es el único punto de entrada manual
   para las cuatro grandes cajas de pruebas de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo,
   carril, trabajo de workflow, perfil de paquete, proveedor o allowlist de modelo fallido más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie modificada deje obsoleta
   la evidencia anterior.
9. Para alpha o beta, etiqueta `vYYYY.M.D-alpha.N` o `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   publica primero en npm todos los paquetes de Plugin publicables, publica el mismo
   conjunto en ClawHub después y luego promociona el artefacto preparado de verificación previa npm de OpenClaw
   con el dist-tag correspondiente. Después de publicar, ejecuta la aceptación de paquete posterior a la publicación
   contra el paquete publicado `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N`, o `openclaw@beta`. Si un prelanzamiento enviado o
   publicado necesita una corrección, crea el siguiente número de prelanzamiento correspondiente;
   no elimines ni reescribas el prelanzamiento anterior.
10. Para estable, continúa solo después de que la beta examinada o la candidata de lanzamiento tenga la
    evidencia de validación requerida. La publicación estable de npm también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto correcto de verificación previa mediante
    `preflight_run_id`; la preparación del lanzamiento estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E opcional de Telegram
    publicado en npm independiente cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, las notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Verificación previa del lanzamiento

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de ciclos
  de importación y límites de arquitectura estén verdes fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento
  esperados `dist/*` y el paquete de Control UI existan para el paso de validación
  de empaquetado
- Ejecuta `pnpm plugins:sync` después del aumento de versión raíz y antes de etiquetar. Actualiza
  las versiones de paquetes de plugins publicables, los metadatos de compatibilidad
  peer/API de OpenClaw, los metadatos de compilación y los stubs de changelog de plugins para que coincidan con la versión de lanzamiento
  del core. `pnpm plugins:sync:check` es la guarda de lanzamiento no mutante;
  el flujo de publicación falla antes de cualquier mutación del registro si este paso se
  olvidó.
- Ejecuta el flujo manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todos los test boxes de pre-lanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para install smoke, package acceptance, suites de ruta de lanzamiento de Docker,
  live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta package
  Telegram E2E contra el artefacto `release-package-under-test` de release
  checks. Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo
  Telegram E2E también deba probar el paquete npm publicado. Proporciona
  `package_acceptance_package_spec` después de publicar cuando Package Acceptance
  deba ejecutar su matriz de paquetes/actualización contra el paquete npm enviado en lugar
  del artefacto compilado desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba demostrar que la
  validación coincide con un paquete npm publicado sin forzar Telegram E2E.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo manual `Package Acceptance` cuando quieras prueba por canal alternativo
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con SHA-256
  obligatorio; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El flujo resuelve el candidato a
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles Docker
  seleccionados incluyen `published-upgrade-survivor`, el artefacto del paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto para paquete/actualización/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta el flujo manual `CI` directamente cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Linux Node, shards de plugins empaquetados, contratos de canales,
  compatibilidad de Node 22, `check`, `check-additional`, build smoke,
  comprobaciones de docs, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` cuando valides telemetría de lanzamiento. Ejercita
  QA-lab a través de un receptor OTLP/HTTP local y verifica los nombres de spans
  de trazas exportadas, atributos acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro colector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que la
  etiqueta exista. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento y el `preflight_run_id` exitoso de OpenClaw npm,
  y conserva el alcance predeterminado de publicación de plugins
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El
  flujo serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw
  para que el paquete core no se publique antes que sus plugins externalizados.
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil rápido
  de Matrix live y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI.
  Ejecuta el flujo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte
  Matrix, medios y E2EE en paralelo.
- La validación de instalación y actualización runtime entre sistemas operativos forma parte de
  `OpenClaw Release Checks` público y de `Full Release Validation`, que llaman directamente
  al flujo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su
  propio carril para que no retrasen ni bloqueen la publicación
- Las comprobaciones de lanzamiento con secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de flujo `main`/release para que la lógica del flujo y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- El preflight solo de validación de `OpenClaw NPM Release` también acepta el SHA completo
  actual de 40 caracteres del commit de la rama del flujo sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos de paquete; la publicación real sigue requiriendo una etiqueta real de lanzamiento
- Ambos flujos mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras la ruta de validación no mutante puede usar los runners Linux más grandes
  de Blacksmith
- Ese flujo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- El preflight de lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación
  del registro publicado en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding del paquete instalado, la configuración de Telegram y el Telegram E2E real
  contra el paquete npm publicado usando el pool compartido de credenciales de Telegram arrendadas.
  Las ejecuciones locales puntuales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamientos de mantenedores ahora usa preflight-luego-promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución de preflight exitosa
  - los lanzamientos npm estables apuntan de forma predeterminada a `beta`
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante entrada del flujo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el
    repo público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una
    rama de lanzamiento pero el flujo se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de Mac debe pasar `preflight_run_id` y `validate_run_id`
    privados de Mac exitosos
  - las rutas de publicación reales promueven artefactos preparados en lugar de compilarlos
    de nuevo
- Para lanzamientos de corrección estable como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en el
  payload estable base
- El preflight de lanzamiento npm falla cerrado salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como un payload no vacío `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los entrypoints de plugins publicados y
  los metadatos de paquete estén presentes en el layout del registro instalado. Un lanzamiento que
  envía payloads runtime de plugins faltantes falla el verificador postpublish y
  no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del npm pack en
  el tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó planificación de CI, manifiestos de timing de plugins o
  matrices de pruebas de plugins, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un layout de CI obsoleto
- La preparación para lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe mantener un bundle id no debug, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso de compilación canónico de Sparkle
    para esa versión de lanzamiento

## Test boxes de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas de pre-lanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama de movimiento rápido, usa el
helper para que cada flujo hijo se ejecute desde una rama temporal fijada al SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija más nueva de `main`.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo `main`
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

El flujo de trabajo resuelve la referencia de destino, despacha `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks` y despacha
Telegram E2E de paquete independiente cuando `release_profile=full` con
`rerun_group=all` o cuando `npm_telegram_package_spec` está definido. Luego
`OpenClaw Release Checks` despliega install smoke, comprobaciones de lanzamiento
entre sistemas operativos, cobertura live/E2E de ruta de lanzamiento Docker,
Package Acceptance con QA de paquete Telegram, paridad de QA Lab, Matrix en vivo
y Telegram en vivo. Una ejecución completa solo es aceptable cuando el resumen de
`Full Release Validation`
muestra `normal_ci` y `release_checks` como correctos. En modo full/all,
el hijo `npm_telegram` también debe ser correcto; fuera de full/all se omite
a menos que se haya proporcionado un `npm_telegram_package_spec` publicado. El resumen
final del verificador incluye tablas de trabajos más lentos para cada ejecución hija,
para que el responsable del lanzamiento pueda ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la
matriz completa de etapas, los nombres exactos de trabajos de flujo de trabajo, las
diferencias entre perfiles estable y completo, los artefactos y los identificadores de
reejecución enfocada.
Los flujos de trabajo hijos se despachan desde la referencia de confianza que ejecuta
`Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino
apunta a una rama o etiqueta de lanzamiento anterior. No hay una entrada separada de
referencia de flujo de trabajo de Full Release Validation; elige el arnés de confianza
eligiendo la referencia de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para prueba exacta de commit en un `main` móvil;
los SHA de commits sin procesar no pueden ser referencias de despacho de flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: la ruta crítica de lanzamiento más rápida de OpenAI/core live y Docker
- `stable`: mínimo más cobertura estable de proveedor/backend para aprobación de lanzamiento
- `full`: estable más cobertura amplia de proveedores/medios de asesoría

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia de destino
una vez como `release-package-under-test` y reutiliza ese artefacto tanto en las comprobaciones
Docker de ruta de lanzamiento como en Package Acceptance. Esto mantiene todas las cajas
orientadas a paquetes sobre los mismos bytes y evita compilaciones de paquete repetidas.
El install smoke de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/organización está definida; de lo contrario, `openai/gpt-5.4`, porque esta lane
demuestra la instalación del paquete, el onboarding, el arranque de Gateway y un turno de agente en vivo
en lugar de comparar el modelo predeterminado más lento. La matriz live de proveedores más amplia
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

No uses el paraguas completo como primera reejecución después de una corrección enfocada. Si una caja
falla, usa el flujo de trabajo hijo, el trabajo, la lane Docker, el perfil de paquete, el proveedor
del modelo o la lane de QA fallidos para la siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando
la corrección haya cambiado la orquestación compartida de lanzamiento o haya vuelto obsoleta la evidencia
previa de todas las cajas. El verificador final del paraguas vuelve a comprobar los ids registrados de ejecución
de flujos de trabajo hijos, así que después de que un flujo de trabajo hijo se reejecute correctamente, reejecuta solo el trabajo padre
`Verify full validation` fallido.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
de candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease`
ejecuta solo el hijo de Plugin exclusivo de lanzamiento, `release-checks` ejecuta todas las cajas
de lanzamiento, y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las reejecuciones enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all
con `release_profile=full` usan el artefacto de paquete de release-checks.

### Vitest

La caja Vitest es el flujo de trabajo hijo `CI` manual. La CI manual omite
intencionadamente el alcance por cambios y fuerza el grafo normal de pruebas para el candidato
de lanzamiento: fragmentos de Linux Node, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22,
`check`, `check-additional`, build smoke, comprobaciones de documentación, Skills de Python, Windows, macOS, Android
y i18n de Control UI.

Usa esta caja para responder "¿el árbol de código fuente pasó toda la suite normal de pruebas?"
No es lo mismo que la validación de producto de ruta de lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de ejecución de `CI` despachada
- ejecución de `CI` en verde sobre el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta la CI manual directamente solo cuando el lanzamiento necesite CI normal determinista pero
no las cajas de Docker, QA Lab, live, entre sistemas operativos o paquete:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La caja Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo en modo lanzamiento
`install-smoke`. Valida el candidato de lanzamiento mediante entornos Docker empaquetados
en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de lanzamiento incluye:

- install smoke completo con el install smoke global lento de Bun habilitado
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA de destino, con trabajos smoke de QR,
  raíz/Gateway e instalador/Bun ejecutándose como fragmentos install-smoke separados
- lanes E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- lanes divididas de instalación/desinstalación de plugins incluidos
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites live/E2E de proveedores y cobertura live de modelos Docker cuando las comprobaciones de lanzamiento
  incluyen suites live

Usa los artefactos Docker antes de reejecutar. El planificador de ruta de lanzamiento sube
`.artifacts/docker-tests/` con registros de lanes, `summary.json`, `failures.json`,
tiempos de fases, JSON de plan del planificador y comandos de reejecución. Para recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de
reejecutar todos los fragmentos de lanzamiento. Los comandos de reejecución generados incluyen el
`package_artifact_run_id` previo y las entradas de imagen Docker preparada cuando están disponibles, para que una
lane fallida pueda reutilizar el mismo tarball y las imágenes GHCR.

### QA Lab

La caja QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento
de comportamiento agéntico y a nivel de canales, separada de Vitest y de la mecánica
de paquetes Docker.

La cobertura QA Lab de lanzamiento incluye:

- lane de paridad mock que compara la lane candidata de OpenAI contra la línea base Opus 4.6
  usando el paquete de paridad agéntica
- perfil rápido de QA Matrix en vivo usando el entorno `qa-live-shared`
- lane de QA Telegram en vivo usando leases de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta caja para responder "¿el lanzamiento se comporta correctamente en escenarios de QA y
flujos de canales en vivo?" Conserva las URL de artefactos para las lanes de paridad, Matrix y Telegram
al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una ejecución manual
fragmentada de QA-Lab en lugar de la lane predeterminada crítica de lanzamiento.

### Paquete

La caja Package es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolver
`scripts/resolve-openclaw-package-candidate.mjs`. El resolver normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene la
referencia del arnés de flujo de trabajo separada de la referencia de origen del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA completo de commit de `package_ref` de confianza
  con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS con `package_sha256` obligatorio
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de lanzamiento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` y
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la actualización, la limpieza de dependencias
obsoletas de plugins, fixtures de plugins offline, actualización de plugins y QA de paquete Telegram
contra el mismo tarball resuelto. La matriz de actualización cubre todas las líneas base estables publicadas en npm desde `2026.4.23` hasta `latest`; usa
Package Acceptance con `source=npm` para un candidato ya publicado, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes de
publicar. Es el reemplazo nativo de GitHub
para la mayor parte de la cobertura de paquete/actualización que antes requería
Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen siendo importantes para onboarding,
instalador y comportamiento específico de plataforma, pero la validación de producto de paquete/actualización debe
preferir Package Acceptance.

La lista de verificación canónica para validación de actualizaciones y plugins es
[Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué lane local, Docker, Package Acceptance o de comprobación de lanzamiento prueba un
cambio de instalación/actualización de Plugin, limpieza de doctor o migración de paquete publicado.
La migración exhaustiva de actualización publicada desde todos los paquetes estables `2026.4.23+` es
un flujo de trabajo manual separado `Update Migration`, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionadamente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para huecos de metadatos ya publicados
en npm: entradas privadas de inventario de QA ausentes del tarball, falta de
`gateway install --wrapper`, archivos de parches ausentes en el fixture git derivado del tarball,
falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins,
falta de persistencia de registros de instalación de marketplace y migración de metadatos de configuración
durante `plugins update`. El paquete publicado `2026.4.26` puede advertir
por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores
deben satisfacer los contratos modernos de paquete; esos mismos huecos fallan la validación
de lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de lanzamiento sea sobre un
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

Perfiles comunes de paquete:

- `smoke`: lanes rápidas de instalación de paquete/canal/agente, red de Gateway y
  recarga de configuración
- `package`: contratos de paquete de instalación/actualización/Plugin sin ClawHub live; este es el valor predeterminado
  de release-check
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos Docker de ruta de lanzamiento con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para reejecuciones enfocadas

Para la prueba de Telegram del paquete candidato, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el
tarball `package-under-test` resuelto al carril de Telegram; el flujo de trabajo
independiente de Telegram todavía acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de versiones

`OpenClaw Release Publish` es el punto de entrada normal para publicaciones mutables. Orquesta los flujos de trabajo de publicador de confianza en el orden que la versión requiere:

1. Extrae la etiqueta de versión y resuelve su SHA de commit.
2. Verifica que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecuta `pnpm plugins:sync:check`.
4. Lanza `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Lanza `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Lanza `OpenClaw NPM Release` con la etiqueta de versión, la dist-tag de npm y
   el `preflight_run_id` guardado.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Ejemplo de publicación alfa:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
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
solo para trabajos específicos de reparación o republicación. Para una reparación de plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o lanza directamente el flujo de trabajo secundario cuando el
paquete OpenClaw no deba publicarse.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria como `v2026.4.2`, `v2026.4.2-1`, o
  `v2026.4.2-alpha.1` o `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit completo de 40 caracteres actual de la rama del flujo de trabajo para una comprobación previa solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquetización, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución previa correcta
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; por defecto es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución previa correcta de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta npm de destino para el paquete OpenClaw
- `plugin_publish_scope`: por defecto es `all-publishable`; usa `selected` solo
  para trabajos específicos de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: por defecto es `true`; configúralo en `false` solo cuando uses el
  flujo de trabajo como orquestador de reparación solo para plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo que se debe validar. Las comprobaciones con secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  una etiqueta de versión.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas de versión preliminar alfa solo pueden publicarse en `alpha`
- Las etiquetas de versión preliminar beta solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la comprobación previa;
  el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de versión npm estable

Al preparar una versión npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo actual de la rama del flujo de trabajo para una ejecución de prueba solo de validación del flujo de trabajo de comprobación previa
2. Elige `npm_dist_tag=beta` para el flujo normal de beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de versión, la etiqueta de versión o el SHA de commit completo cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab,
   Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la referencia de versión en su lugar
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo `npm_dist_tag`,
   y el `preflight_run_id` guardado; publica plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si la versión quedó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si la versión se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autocorrección mueva `beta` más tarde

La mutación de dist-tag vive en el repo privado por seguridad, porque todavía
requiere `NPM_TOKEN`, mientras que el repo público mantiene la publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción con beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación npm local, ejecuta cualquier comando de la
CLI de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
directamente desde el shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
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

Los mantenedores usan la documentación privada de versiones en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
