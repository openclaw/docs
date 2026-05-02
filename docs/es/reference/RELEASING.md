---
read_when:
    - Buscando definiciones públicas de canales de lanzamiento
    - Ejecutar la validación de lanzamiento o la aceptación del paquete
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de comprobación del operador, cajas de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-05-02T23:39:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales públicos de lanzamiento:

- stable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de versión preliminar que se publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión preliminar beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellene con ceros el mes ni el día
- `latest` significa el lanzamiento estable actual de npm promocionado
- `beta` significa el destino de instalación beta actual
- Los lanzamientos estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promocionar más tarde una compilación beta evaluada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la aplicación macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, con
  la compilación/firma/notarización de la aplicación Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Estable viene solo después de que se valide la beta más reciente
- Los mantenedores normalmente cortan los lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir de `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los mantenedores cortan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta antigua
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para mantenedores

## Lista de comprobación del operador de lanzamiento

Esta lista de comprobación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el manual de lanzamiento solo para mantenedores.

1. Comience desde `main` actual: haga pull de lo más reciente, confirme que el commit objetivo se haya enviado,
   y confirme que la CI de `main` actual esté suficientemente verde para crear una rama desde ella.
2. Reescriba la sección superior de `CHANGELOG.md` desde el historial real de commits con
   `/changelog`, mantenga las entradas orientadas al usuario, confírmela, envíela, y haga rebase/pull
   una vez más antes de crear la rama.
3. Revise los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimine compatibilidad caducada
   solo cuando la ruta de actualización siga cubierta, o registre por qué se mantiene
   intencionalmente.
4. Cree `release/YYYY.M.D` desde `main` actual; no realice el trabajo normal de lanzamiento
   directamente en `main`.
5. Actualice cada ubicación de versión requerida para la etiqueta prevista, ejecute
   `pnpm plugins:sync` para que los paquetes Plugin publicables compartan la versión de lanzamiento
   y los metadatos de compatibilidad, y luego ejecute la verificación previa determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, y
   `pnpm release:check`.
6. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de rama de lanzamiento de 40 caracteres solo para la validación
   de verificación previa. Guarde el `preflight_run_id` exitoso.
7. Inicie todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, la etiqueta o el SHA de commit completo. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corríjalo en la rama de lanzamiento y vuelva a ejecutar el archivo,
   canal, trabajo de workflow, perfil de paquete, proveedor o allowlist de modelos fallido más pequeño que
   demuestre la corrección. Vuelva a ejecutar el paraguas completo solo cuando la superficie cambiada vuelva
   obsoleta la evidencia anterior.
9. Para beta, etiquete `vYYYY.M.D-beta.N`, luego ejecute `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   publica primero en npm todos los paquetes Plugin publicables, publica el mismo
   conjunto en ClawHub en segundo lugar, y luego promociona el artefacto de verificación previa npm de OpenClaw preparado
   con el dist-tag correspondiente. Después de publicar, ejecute la aceptación de paquete
   posterior a la publicación contra el paquete publicado `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Si una versión preliminar enviada o publicada necesita una corrección,
   corte el siguiente número de versión preliminar correspondiente; no elimine ni reescriba la versión preliminar
   antigua.
10. Para estable, continúe solo después de que la beta evaluada o el candidato de lanzamiento tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de verificación previa exitoso mediante
    `preflight_run_id`; la preparación del lanzamiento estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecute el verificador npm posterior a la publicación, el E2E de Telegram
    publicado-npm independiente opcional cuando necesite prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesaria, las notas de lanzamiento/versión preliminar de GitHub desde la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Verificación previa del lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa de lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida de `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa de lanzamiento para que las comprobaciones más amplias de ciclos de
  importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento
  `dist/*` esperados y el paquete de Control UI existan para el paso de validación
  del paquete
- Ejecuta `pnpm plugins:sync` después del incremento de versión raíz y antes de etiquetar. Actualiza
  las versiones de paquetes de plugins publicables, los metadatos de compatibilidad de pares/API
  de OpenClaw, los metadatos de compilación y los stubs de changelog de plugins para que coincidan con la versión
  de lanzamiento del núcleo. `pnpm plugins:sync:check` es la guarda de lanzamiento no mutante;
  el flujo de publicación falla antes de cualquier mutación del registro si este paso se
  olvidó.
- Ejecuta el workflow manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todas las cajas de prueba previas al lanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA de commit completo, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, suites de ruta de lanzamiento
  de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram.
  Con `release_profile=full` y `rerun_group=all`, también ejecuta el E2E de Telegram de paquete
  contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento. Proporciona
  `npm_telegram_package_spec` después de publicar cuando el mismo E2E de Telegram también deba probar
  el paquete npm publicado. Proporciona
  `package_acceptance_package_spec` después de publicar cuando Package Acceptance
  deba ejecutar su matriz de paquete/actualización contra el paquete npm enviado en lugar
  del artefacto construido desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba demostrar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el workflow manual `Package Acceptance` cuando quieras una prueba por canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de
  GitHub Actions. El workflow resuelve el candidato en
  `package-under-test`, reutiliza el programador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles de Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles de paquete/actualización/plugin nativos del artefacto sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta directamente el workflow manual `CI` cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Linux Node, los shards de plugins agrupados, contratos de canal,
  compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación,
  comprobaciones de docs, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de trazas
  exportados, los atributos acotados y la redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro recolector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que
  exista la etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento y el `preflight_run_id`
  correcto de npm de OpenClaw, y conserva el alcance de publicación de plugins predeterminado
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El
  workflow serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la
  publicación npm de OpenClaw para que el paquete del núcleo no se publique antes que sus
  plugins externalizados.
- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil rápido
  de Matrix live y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa leases de credenciales de Convex CI.
  Ejecuta el workflow manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de
  transporte, medios y E2EE de Matrix en paralelo.
- La validación en tiempo de ejecución de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  workflow reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su
  propio carril para que no demoren ni bloqueen la publicación
- Las comprobaciones de lanzamiento con secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de workflow `main`/release para que la lógica del workflow y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA de commit completo siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo
  de 40 caracteres del commit actual de la rama del workflow sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la comprobación de
  metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes
  de Blacksmith
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa de lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro
  publicado en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding de paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el pool compartido de credenciales alquiladas de Telegram.
  Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento de mantenedores ahora usa verificación previa y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm correcto
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución correcta de verificación previa
  - los lanzamientos npm estables apuntan a `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante la entrada del workflow
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` aún necesita `NPM_TOKEN` mientras el
    repo público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una
    rama de lanzamiento pero el workflow se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe pasar un `preflight_run_id` y
    `validate_run_id` privados de mac correctos
  - las rutas de publicación reales promueven artefactos preparados en lugar de reconstruirlos
    de nuevo
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en el
  payload estable base
- La verificación previa de lanzamiento npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como un payload no vacío `dist/control-ui/assets/`
  para no volver a enviar un dashboard de navegador vacío
- La verificación posterior a la publicación también comprueba que los entrypoints de plugins publicados y
  los metadatos de paquetes estén presentes en el diseño del registro instalado. Un lanzamiento que
  envía payloads de runtime de plugins faltantes falla el verificador posterior a la publicación y
  no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del paquete npm en
  el tarball de actualización candidato, para que el e2e del instalador detecte bloat accidental del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un diseño de CI obsoleto
- La preparación del lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe conservar un id de bundle no debug, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Cajas de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama de movimiento rápido, usa el
helper para que cada workflow hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de workflow hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija más nueva de `main`.

Para la validación de una rama o etiqueta de lanzamiento, ejecútala desde la referencia de workflow `main`
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
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks` y despacha el E2E
independiente del paquete de Telegram cuando `release_profile=full` con
`rerun_group=all` o cuando `npm_telegram_package_spec` está definido. Luego,
`OpenClaw Release
Checks` despliega smoke de instalación, comprobaciones de lanzamiento entre
sistemas operativos, cobertura live/E2E Docker de la ruta de lanzamiento,
Package Acceptance con QA del paquete de Telegram, paridad de QA Lab, Matrix
live y Telegram live. Una ejecución completa solo es aceptable cuando el resumen
de `Full Release Validation` muestra `normal_ci` y `release_checks` como
correctos. En modo full/all, el hijo `npm_telegram` también debe ser correcto;
fuera de full/all se omite salvo que se haya proporcionado un
`npm_telegram_package_spec` publicado. El resumen final del verificador incluye
tablas de trabajos más lentos para cada ejecución hija, de modo que el
responsable del lanzamiento pueda ver la ruta crítica actual sin descargar
registros.
Consulta [validación completa del lanzamiento](/es/reference/full-release-validation) para ver la
matriz de etapas completa, los nombres exactos de los trabajos del flujo de
trabajo, las diferencias entre los perfiles stable y full, los artefactos y los
identificadores de reejecución focalizada.
Los flujos de trabajo hijos se despachan desde la ref de confianza que ejecuta
`Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta
a una rama o etiqueta de lanzamiento anterior. No hay una entrada independiente
de ref de flujo de trabajo para Full Release Validation; elige el arnés de
confianza eligiendo la ref de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para prueba de commit exacto en un `main` móvil;
los SHA de commit sin procesar no pueden ser refs de despacho de flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/de proveedor:

- `minimum`: ruta Docker y OpenAI/core live más rápida y crítica para el lanzamiento
- `stable`: minimum más cobertura de proveedor/backend stable para aprobación del lanzamiento
- `full`: stable más cobertura amplia de proveedor/medios consultiva

`OpenClaw Release Checks` usa la ref de flujo de trabajo de confianza para resolver
la ref de destino una vez como `release-package-under-test` y reutiliza ese
artefacto tanto en las comprobaciones Docker de la ruta de lanzamiento como en
Package Acceptance. Esto mantiene todas las cajas orientadas a paquetes en los
mismos bytes y evita compilaciones repetidas del paquete.
El smoke de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/org está definida; de lo contrario, `openai/gpt-5.4`, porque esta línea está
probando la instalación del paquete, el onboarding, el arranque del Gateway y un
turno live de agente, no comparando el modelo predeterminado más lento. La matriz
más amplia de proveedores live sigue siendo el lugar para la cobertura específica de modelos.

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
focalizada. Si falla una caja, usa el flujo de trabajo hijo, trabajo, línea
Docker, perfil de paquete, proveedor de modelo o línea QA fallidos para la
siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando la corrección
haya cambiado la orquestación compartida del lanzamiento o haya vuelto obsoleta
la evidencia previa de todas las cajas. El verificador final del paraguas vuelve
a comprobar los ids registrados de las ejecuciones de flujos de trabajo hijos, así que después de que un
flujo de trabajo hijo se reejecute correctamente, reejecuta solo el trabajo padre
`Verify full validation` fallido.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución
real del candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal,
`plugin-prerelease` ejecuta solo el hijo de plugin exclusivo del lanzamiento,
`release-checks` ejecuta todas las cajas de lanzamiento, y los grupos de
lanzamiento más estrechos son `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las reejecuciones focalizadas de `npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones
full/all con `release_profile=full` usan el artefacto de paquete de release-checks.

### Vitest

La caja de Vitest es el flujo de trabajo hijo manual `CI`. La CI manual omite
intencionadamente el alcance por cambios y fuerza el grafo de pruebas normal
para el candidato de lanzamiento: fragmentos de Linux Node, fragmentos de Plugins
incluidos, contratos de canales, compatibilidad con Node 22, `check`,
`check-additional`, smoke de compilación, comprobaciones de documentación, Skills
de Python, Windows, macOS, Android y i18n de Control UI.

Usa esta caja para responder "¿el árbol de código fuente pasó la suite normal
completa de pruebas?". No es lo mismo que la validación de producto en ruta de
lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestre la URL de la ejecución `CI` despachada
- ejecución `CI` verde en el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de temporización de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando
  una ejecución necesite análisis de rendimiento

Ejecuta la CI manual directamente solo cuando el lanzamiento necesite CI normal
determinista, pero no las cajas Docker, QA Lab, live, entre sistemas operativos
o de paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La caja Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo
`install-smoke` en modo de lanzamiento. Valida el candidato de lanzamiento
mediante entornos Docker empaquetados, no solo pruebas a nivel de fuente.

La cobertura Docker de lanzamiento incluye:

- smoke de instalación completo con el smoke de instalación global lenta de Bun habilitado
- preparación/reutilización de imagen de smoke del Dockerfile raíz por SHA de destino, con trabajos de QR,
  raíz/Gateway e instalador/Bun ejecutándose como fragmentos install-smoke separados
- líneas E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicite
- líneas divididas de instalación/desinstalación de Plugins incluidos
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites de proveedores live/E2E y cobertura Docker de modelos live cuando las comprobaciones de lanzamiento
  incluyan suites live

Usa los artefactos Docker antes de reejecutar. El planificador de ruta de
lanzamiento sube `.artifacts/docker-tests/` con registros de línea,
`summary.json`, `failures.json`, tiempos de fase, JSON del plan del planificador
y comandos de reejecución. Para recuperación focalizada, usa
`docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en vez de
reejecutar todos los fragmentos de lanzamiento. Los comandos de reejecución
generados incluyen `package_artifact_run_id` previo y entradas de imagen Docker
preparada cuando están disponibles, de modo que una línea fallida pueda reutilizar
el mismo tarball y las imágenes GHCR.

### QA Lab

La caja QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de
lanzamiento de comportamiento agéntico y a nivel de canal, separada de la mecánica
de paquetes de Vitest y Docker.

La cobertura de QA Lab de lanzamiento incluye:

- línea de paridad mock que compara la línea candidata OpenAI con la línea base
  Opus 4.6 usando el paquete de paridad agéntica
- perfil rápido de QA Matrix live usando el entorno `qa-live-shared`
- línea QA de Telegram live usando leases de credenciales CI de Convex
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta caja para responder "¿el lanzamiento se comporta correctamente en escenarios
QA y flujos de canales live?". Conserva las URLs de artefactos para las líneas de
paridad, Matrix y Telegram al aprobar el lanzamiento. La cobertura completa de Matrix
sigue disponible como una ejecución manual fragmentada de QA-Lab, no como la línea
crítica de lanzamiento predeterminada.

### Paquete

La caja Package es la puerta de producto instalable. Está respaldada por
`Package Acceptance` y el resolutor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolutor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida el
inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene
la ref del arnés del flujo de trabajo separada de la ref fuente del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA de commit completo de `package_ref` de confianza
  con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de lanzamiento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` y
`telegram_mode=mock-openai`. Package Acceptance mantiene migración, actualización,
limpieza de dependencias de Plugins obsoletas, fixtures de Plugins offline,
actualización de Plugins y QA del paquete de Telegram contra el mismo tarball
resuelto. La matriz de actualización cubre cada línea base stable publicada en npm desde `2026.4.23` hasta `latest`; usa
Package Acceptance con `source=npm` para un candidato ya enviado, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes
de publicar. Es el reemplazo nativo de GitHub para la mayor parte de la cobertura
de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de
lanzamiento entre sistemas operativos siguen siendo importantes para onboarding,
instalador y comportamiento de plataforma específicos del sistema operativo, pero
la validación de producto de paquetes/actualizaciones debe preferir Package Acceptance.

La lista canónica para validación de actualizaciones y Plugins es
[probar actualizaciones y Plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué línea local, Docker, Package Acceptance o release-check prueba un
cambio de instalación/actualización de Plugin, limpieza de doctor o migración de
paquete publicado. La migración exhaustiva de actualización publicada desde cada
paquete stable `2026.4.23+` es un flujo de trabajo manual separado `Update Migration`,
no parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionadamente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para vacíos de metadatos ya publicados
en npm: entradas privadas de inventario QA ausentes del tarball, falta de
`gateway install --wrapper`, archivos de parche ausentes en el fixture git
derivado del tarball, falta de persistencia de `update.channel`, ubicaciones
heredadas de registro de instalación de Plugins, falta de persistencia de
registro de instalación de marketplace y migración de metadatos de configuración
durante `plugins update`. El paquete publicado `2026.4.26` puede advertir sobre
archivos de marca de metadatos de compilación local que ya se enviaron. Los paquetes
posteriores deben satisfacer los contratos de paquete modernos; esos mismos vacíos
fallan la validación de lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta del lanzamiento
sea sobre un paquete realmente instalable:

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

- `smoke`: líneas rápidas de instalación de paquete/canal/agente, red de Gateway y
  recarga de configuración
- `package`: contratos de paquete de instalación/actualización/Plugin sin ClawHub live; este es el valor
  predeterminado de release-check
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos Docker de ruta de lanzamiento con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para reejecuciones focalizadas

Para la prueba de Telegram de candidato de paquete, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el
tarball `package-under-test` resuelto al carril de Telegram; el flujo de trabajo
independiente de Telegram aún acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamientos

`OpenClaw Release Publish` es el punto de entrada mutante normal de publicación. Orquesta
los flujos de trabajo de publicador de confianza en el orden que necesita el lanzamiento:

1. Extrae la etiqueta de lanzamiento y resuelve su SHA de commit.
2. Verifica que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecuta `pnpm plugins:sync:check`.
4. Activa `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Activa `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Activa `OpenClaw NPM Release` con la etiqueta de lanzamiento, el dist-tag de npm y
   el `preflight_run_id` guardado.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publicación estable al dist-tag beta predeterminado:

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
solo para trabajos enfocados de reparación o republicación. Para una reparación de plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o activa el flujo de trabajo hijo directamente cuando el
paquete de OpenClaw no deba publicarse.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo de 40 caracteres de la rama del flujo de trabajo actual para una comprobación previa solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución de comprobación previa correcta
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida; ya debe existir
- `preflight_run_id`: id de ejecución de comprobación previa correcta de `OpenClaw NPM Release`;
  requerido cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo cuando uses el
  flujo de trabajo como orquestador de reparación solo para plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones que contienen secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  una etiqueta de lanzamiento.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la comprobación previa;
  el flujo de trabajo verifica esos metadatos antes de que la publicación continúe

## Secuencia de lanzamiento estable de npm

Al preparar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo de la rama del flujo de trabajo actual
     para una ejecución de prueba solo de validación del flujo de trabajo de comprobación previa
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de commit completo
   cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab,
   Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la ref de lanzamiento en su lugar
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica los plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el lanzamiento quedó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir de inmediato la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambos dist-tags a la versión estable, o deja que su sincronización programada
   de autorreparación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque aún
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un maintainer debe recurrir a autenticación npm local, ejecuta cualquier comando de la CLI
de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
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

Los maintainers usan la documentación privada de lanzamientos en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
