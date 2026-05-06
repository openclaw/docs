---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de lanzamiento o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Carriles de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-06T18:00:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales públicos de lanzamiento:

- estable: versiones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de versión preliminar que se publican en npm `beta`
- dev: la punta móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión preliminar beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión estable promovida actual de npm
- `beta` significa el destino de instalación beta actual
- Las versiones estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar a `latest` explícitamente, o promover más adelante una compilación beta evaluada
- Cada versión estable de OpenClaw entrega el paquete npm y la app de macOS juntos;
  las versiones beta normalmente validan y publican primero la ruta npm/paquete, con
  la compilación/firma/notarización de la app de Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente crean lanzamientos desde una rama `release/YYYY.M.D` creada
  desde el `main` actual, de modo que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el runbook de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: descarga lo más reciente, confirma que el commit de destino se haya enviado,
   y confirma que la CI actual de `main` esté lo bastante verde como para crear una rama desde ella.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina compatibilidad caducada
   solo cuando la ruta de actualización siga cubierta, o registra por qué se mantiene
   intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas el trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes Plugin publicables compartan la versión de lanzamiento
   y los metadatos de compatibilidad, luego ejecuta la verificación previa determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento solo para validación
   previa. Guarda el `preflight_run_id` correcto.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA de commit completo. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo,
   canal, job de workflow, perfil de paquete, proveedor o lista de modelos permitidos fallidos más pequeños que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie modificada haga
   que la evidencia previa quede obsoleta.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   despacha todos los paquetes Plugin publicables a npm y el mismo conjunto a
   ClawHub en paralelo, y luego promueve el artefacto de verificación previa npm de OpenClaw preparado
   con el dist-tag correspondiente en cuanto la publicación npm de Plugin se complete correctamente.
   La publicación en ClawHub puede seguir ejecutándose mientras npm de OpenClaw se publica, pero el
   workflow de publicación de lanzamiento no finaliza hasta que ambas rutas de publicación de Plugin y
   la ruta de publicación npm de OpenClaw se hayan completado correctamente. Después de publicar, ejecuta
   la aceptación de paquete
   posterior a la publicación contra el paquete publicado `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Si una versión preliminar enviada o publicada necesita una corrección,
   crea el siguiente número de versión preliminar correspondiente; no elimines ni reescribas la versión preliminar anterior.
10. Para estable, continúa solo después de que la beta evaluada o candidata de lanzamiento tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de verificación previa correcto mediante
    `preflight_run_id`; la preparación del lanzamiento estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados, y `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E opcional de Telegram
    standalone de npm publicado cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesaria, las notas de lanzamiento/versión preliminar de GitHub desde la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Verificación previa de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa de release para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida de `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa de release para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de release esperados
  `dist/*` y el bundle de Control UI existan para el paso de validación
  del paquete
- Ejecuta `pnpm plugins:sync` después del aumento de versión raíz y antes del etiquetado. Actualiza las versiones de paquetes de plugins publicables, los metadatos de compatibilidad
  de pares/API de OpenClaw, los metadatos de compilación y los stubs de changelog de plugins para que coincidan con la versión de release
  principal. `pnpm plugins:sync:check` es la guarda de release no mutante;
  el flujo de publicación falla antes de cualquier mutación del registro si este paso se
  olvidó.
- Ejecuta el workflow manual `Full Release Validation` antes de la aprobación de release para
  iniciar todos los bancos de prueba previos al release desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA de commit completo, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes
  entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas
  mantienen la carga exhaustiva live/E2E y Docker de ruta de release detrás de
  `run_release_soak=true`; `release_profile=full` fuerza la carga. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta E2E de Telegram de paquete
  contra el artefacto `release-package-under-test` de las comprobaciones de release.
  Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo
  E2E de Telegram también deba probar el paquete npm publicado. Proporciona
  `package_acceptance_package_spec` después de publicar cuando Package Acceptance
  deba ejecutar su matriz de paquete/actualización contra el paquete npm enviado en lugar
  del artefacto construido desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba probar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el workflow manual `Package Acceptance` cuando quieras prueba de canal lateral
  para un candidato de paquete mientras el trabajo de release continúa. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de release; `source=ref`
  para empaquetar una rama/etiqueta/SHA de confianza de `package_ref` con el arnés
  actual de `workflow_ref`; `source=url` para un tarball HTTPS con un
  SHA-256 requerido; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El workflow resuelve el candidato a
  `package-under-test`, reutiliza el planificador de release Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada. `update-restart-auth` usa el paquete candidato como
  tanto la CLI instalada como el package-under-test para que ejercite la
  ruta de reinicio gestionado del comando de actualización candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles de paquete/actualización/reinicio/plugin nativos del artefacto sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de release Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta el workflow manual `CI` directamente cuando solo necesites cobertura completa normal de CI
  para el candidato de release. Los despachos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Node en Linux, shards de plugins incluidos, contratos de canales,
  compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación,
  comprobaciones de docs, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` cuando valides telemetría de release. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de traza
  exportados, los atributos acotados y la redacción de contenido/identificadores sin
  requerir Opik, Langfuse ni otro recopilador externo.
- Ejecuta `pnpm release:check` antes de cada release etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que exista la
  etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de release y el
  `preflight_run_id` exitoso de npm de OpenClaw, y conserva el alcance de publicación de plugins predeterminado
  `all-publishable` salvo que ejecutes deliberadamente una reparación enfocada. El
  workflow serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw
  para que el paquete principal no se publique antes que sus
  plugins externalizados.
- Las comprobaciones de release ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil rápido
  live de Matrix y el carril QA de Telegram antes de la aprobación de release. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa concesiones de credenciales de CI de Convex.
  Ejecuta el workflow manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte
  Matrix, medios y E2EE en paralelo.
- La validación de runtime de instalación y actualización entre sistemas operativos forma parte de los
  `OpenClaw Release Checks` públicos y de `Full Release Validation`, que llaman
  directamente al workflow reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantener la ruta real de release de npm corta,
  determinista y enfocada en artefactos, mientras que las comprobaciones live más lentas permanecen en su
  propio carril para que no retrasen ni bloqueen la publicación
- Las comprobaciones de release con secretos deben despacharse mediante `Full Release
Validation` o desde la ref de workflow `main`/release para que la lógica de workflow y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA de commit completo siempre que
  el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de release
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA de commit completo
  actual de 40 caracteres de la rama del workflow sin requerir una etiqueta enviada
- Esa ruta de SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de release real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes
  de Blacksmith
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa de release npm ya no espera al carril separado de comprobaciones de release
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal limpio
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales de Telegram concedidas.
  Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta validación de actualización npm/fresh-target en Parallels, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del workflow, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de release de mantenedores ahora usa verificación previa y luego promoción:
  - la publicación real en npm debe pasar un `preflight_run_id` de npm exitoso
  - la publicación real en npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución exitosa de verificación previa
  - los releases npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante la entrada del workflow
  - la mutación de dist-tag de npm basada en tokens ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el
    repositorio público mantiene la publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta solo vive en una
    rama de release pero el workflow se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe pasar `preflight_run_id` y `validate_run_id`
    de mac privado exitosos
  - las rutas de publicación reales promueven artefactos preparados en lugar de reconstruirlos
    otra vez
- Para releases estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de release no puedan dejar silenciosamente instalaciones globales antiguas en la
  carga base estable
- La verificación previa de release npm falla cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía de `dist/control-ui/assets/`
  para no volver a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y
  los metadatos de paquete estén presentes en el diseño del registro instalado. Un release que
  envía cargas de runtime de plugins faltantes falla el verificador postpublish y
  no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` de npm pack en
  el tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del paquete
  antes de la ruta de publicación de release
- Si el trabajo de release tocó la planificación de CI, manifiestos de timing de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador de
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de release no
  describan un diseño de CI obsoleto
- La preparación para release estable de macOS también incluye las superficies del actualizador:
  - el release de GitHub debe acabar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe mantener un bundle id no debug, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle
    para esa versión de release

## Bancos de prueba de release

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al release desde
un único punto de entrada. Para una prueba de commit fijado en una rama que se mueve rápido, usa el
helper para que cada workflow hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de workflow hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar accidentalmente una
ejecución hija de `main` más nueva.

Para validación de rama o etiqueta de release, ejecútala desde la ref de workflow de confianza `main`
y pasa la rama o etiqueta de release como `ref`:

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
a paquetes y despacha el E2E independiente de Telegram del paquete cuando
`release_profile=full` con `rerun_group=all` o cuando se establece
`npm_telegram_package_spec`. `OpenClaw Release Checks` luego distribuye la
comprobación de instalación smoke, las comprobaciones de versión entre sistemas
operativos, la cobertura de ruta de versión en vivo/E2E Docker cuando el soak
está habilitado, Package Acceptance con QA del paquete de Telegram, paridad de
QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa solo es
aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci` y
`release_checks` como correctos. En modo full/all, el hijo `npm_telegram`
también debe completarse correctamente; fuera de full/all se omite salvo que se
haya proporcionado un `npm_telegram_package_spec` publicado. El resumen final
del verificador incluye tablas de trabajos más lentos para cada ejecución hija,
de modo que el responsable de la versión pueda ver la ruta crítica actual sin
descargar registros.
Consulta [Validación completa de la versión](/es/reference/full-release-validation)
para ver la matriz completa de etapas, los nombres exactos de los trabajos del
flujo de trabajo, las diferencias entre los perfiles estable y completo, los
artefactos y los identificadores de repetición focalizados.
Los flujos de trabajo hijos se despachan desde la ref de confianza que ejecuta
`Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de
destino apunta a una rama o etiqueta de versión anterior. No hay una entrada
workflow-ref separada para Full Release Validation; elige el arnés de confianza
eligiendo la ref de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para obtener prueba de commit exacta en una
`main` cambiante; los SHA de commits sin procesar no pueden ser refs de despacho
de flujo de trabajo, así que usa `pnpm ci:full-release --sha <sha>` para crear
la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud en vivo/proveedor:

- `minimum`: ruta más rápida crítica para la versión de OpenAI/core en vivo y Docker
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de versión
- `full`: stable más cobertura amplia de proveedor/medios consultiva

Usa `run_release_soak=true` con `stable` cuando los carriles bloqueantes de la
versión estén verdes y quieras el barrido exhaustivo en vivo/E2E, la ruta de
versión Docker y el barrido acotado de supervivencia de actualización publicada
antes de la promoción. Ese barrido cubre los cuatro paquetes estables más
recientes más las líneas base fijadas `2026.4.23` y `2026.5.2`, además de la
cobertura anterior `2026.4.15`, con líneas base duplicadas eliminadas y cada
línea base dividida en su propio trabajo de ejecutor Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa la ref de flujo de trabajo de confianza para
resolver una vez la ref de destino como `release-package-under-test` y reutiliza
ese artefacto en las comprobaciones entre sistemas operativos, Package
Acceptance y Docker de ruta de versión cuando se ejecuta el soak. Esto mantiene
todas las máquinas orientadas a paquetes con los mismos bytes y evita
compilaciones de paquetes repetidas. La comprobación de instalación smoke de
OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/org está establecida; de lo contrario, usa `openai/gpt-5.4`,
porque este carril prueba la instalación del paquete, el onboarding, el arranque
del Gateway y un turno de agente en vivo, en lugar de medir el modelo
predeterminado más lento. La matriz más amplia de proveedores en vivo sigue
siendo el lugar para la cobertura específica por modelo.

Usa estas variantes según la etapa de la versión:

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

No uses el paraguas completo como primera repetición después de una corrección
focalizada. Si falla una máquina, usa el flujo de trabajo hijo, el trabajo, el
carril Docker, el perfil de paquete, el proveedor de modelo o el carril QA que
falló para la siguiente prueba. Vuelve a ejecutar el paraguas completo solo
cuando la corrección haya cambiado la orquestación compartida de la versión o
haya vuelto obsoleta la evidencia previa de todas las máquinas. El verificador
final del paraguas vuelve a comprobar los ids de ejecución de los flujos de
trabajo hijos registrados, así que, después de que un flujo de trabajo hijo se
vuelva a ejecutar correctamente, vuelve a ejecutar solo el trabajo padre fallido
`Verify full validation`.

Para una recuperación acotada, pasa `rerun_group` al paraguas. `all` es la
ejecución real de candidato a versión; `ci` ejecuta solo el hijo normal de CI;
`plugin-prerelease` ejecuta solo el hijo de Plugin exclusivo de versión;
`release-checks` ejecuta todas las máquinas de versión, y los grupos de versión
más estrechos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones focalizadas de
`npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all
con `release_profile=full` usan el artefacto de paquete de release-checks. Las
repeticiones focalizadas entre sistemas operativos pueden añadir
`cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de SO/suite. Los
fallos de QA en release-check son consultivos; un fallo solo de QA no bloquea la
validación de versión.

### Vitest

La máquina Vitest es el flujo de trabajo hijo manual `CI`. CI manual omite
intencionadamente el alcance por cambios y fuerza el grafo de pruebas normal
para el candidato a versión: shards Linux Node, shards de plugins incluidos,
contratos de canales, compatibilidad con Node 22, `check`, `check-additional`,
smoke de compilación, comprobaciones de documentación, Skills de Python,
Windows, macOS, Android y Control UI i18n.

Usa esta máquina para responder "¿pasó el árbol de código fuente la suite de
pruebas normal completa?". No es lo mismo que la validación de producto de ruta
de versión. Evidencia que conservar:

- resumen de `Full Release Validation` que muestre la URL de ejecución de `CI` despachada
- ejecución de `CI` verde en el SHA de destino exacto
- nombres de shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando la versión necesita CI normal
determinista, pero no las máquinas Docker, QA Lab, en vivo, entre sistemas
operativos o de paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La máquina Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo
`install-smoke` en modo versión. Valida el candidato a versión mediante entornos
Docker empaquetados en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de versión incluye:

- smoke completo de instalación con el smoke lento de instalación global de Bun habilitado
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA de destino, con trabajos de QR, root/gateway e instalador/Bun smoke ejecutándose como shards separados de install-smoke
- carriles E2E de repositorio
- fragmentos Docker de ruta de versión: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- carriles divididos de instalación/desinstalación de plugins incluidos
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites de proveedores en vivo/E2E y cobertura de modelos en vivo Docker cuando las comprobaciones de versión incluyen suites en vivo

Usa los artefactos Docker antes de repetir la ejecución. El programador de ruta
de versión sube `.artifacts/docker-tests/` con registros de carril,
`summary.json`, `failures.json`, tiempos de fase, JSON del plan del programador
y comandos de repetición. Para una recuperación focalizada, usa
`docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E en
lugar de volver a ejecutar todos los fragmentos de versión. Los comandos de
repetición generados incluyen el `package_artifact_run_id` anterior y entradas
de imagen Docker preparada cuando están disponibles, de modo que un carril
fallido pueda reutilizar el mismo tarball y las imágenes GHCR.

### QA Lab

La máquina QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta
de versión de comportamiento agéntico y a nivel de canal, separada de Vitest y
de la mecánica de paquetes Docker.

La cobertura QA Lab de versión incluye:

- carril de paridad mock que compara el carril candidato de OpenAI con la línea base Opus 4.6 usando el paquete de paridad agéntica
- perfil rápido de QA Matrix en vivo usando el entorno `qa-live-shared`
- carril QA de Telegram en vivo usando leases de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de versión necesita prueba local explícita

Usa esta máquina para responder "¿se comporta correctamente la versión en
escenarios QA y flujos de canales en vivo?". Conserva las URL de artefactos de
los carriles de paridad, Matrix y Telegram al aprobar la versión. La cobertura
Matrix completa sigue disponible como una ejecución manual shardizada de QA-Lab,
en lugar de ser el carril crítico predeterminado de versión.

### Paquete

La máquina Package es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolver
`scripts/resolve-openclaw-package-candidate.mjs`. El resolver normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida el
inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene
la ref del arnés de flujo de trabajo separada de la ref de origen del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA completo de commit de `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS con `package_sha256` obligatorio
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de versión preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la
actualización, el reinicio con autenticación configurada tras actualización, la
limpieza de dependencias obsoletas de plugins, fixtures de plugins offline, la
actualización de plugins y la QA de paquete de Telegram contra el mismo tarball
resuelto. Las comprobaciones de versión bloqueantes usan la línea base
predeterminada del paquete publicado más reciente; `run_release_soak=true` o
`release_profile=full` expande a cada línea base estable publicada en npm desde
`2026.4.23` hasta `latest` más fixtures de incidencias reportadas. Usa Package
Acceptance con `source=npm` para un candidato ya publicado, o `source=ref`/
`source=artifact` para un tarball npm local respaldado por SHA antes de
publicar. Es el reemplazo nativo de GitHub para la mayor parte de la cobertura
de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de
versión entre sistemas operativos siguen siendo importantes para onboarding,
instalador y comportamiento de plataforma específicos del SO, pero la validación
de producto de paquetes/actualizaciones debe preferir Package Acceptance.

La lista de comprobación canónica para validación de actualizaciones y plugins
es [Probar actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué carril local, Docker, Package Acceptance o de release-check prueba
un cambio de instalación/actualización de Plugin, limpieza de doctor o migración
de paquete publicado. La migración exhaustiva de actualización publicada desde
cada paquete estable `2026.4.23+` es un flujo de trabajo manual `Update
Migration` separado, no forma parte de Full Release CI.

La permisividad heredada de aceptación de paquetes está limitada intencionalmente en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas
en npm: entradas privadas del inventario de QA ausentes en el tarball, ausencia de
`gateway install --wrapper`, archivos de parche ausentes en el fixture de git derivado del tarball, ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugin, ausencia de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir
por archivos locales de sello de metadatos de compilación que ya fueron publicados. Los paquetes posteriores
deben satisfacer los contratos modernos de paquetes; esas mismas brechas hacen fallar la validación
de lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de lanzamiento trate sobre un
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

Perfiles comunes de paquetes:

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red de Gateway y recarga
  de configuración
- `package`: contratos de instalación/actualización/reinicio/paquete de plugin sin ClawHub
  en vivo; este es el valor predeterminado de la comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram de un candidato de paquete, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el
tarball resuelto `package-under-test` al carril de Telegram; el flujo de trabajo independiente
de Telegram aún acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamientos

`OpenClaw Release Publish` es el punto de entrada normal de publicación con mutaciones. Orquesta
los flujos de trabajo de publicador confiable en el orden que necesita el lanzamiento:

1. Extraer la etiqueta de lanzamiento y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de lanzamiento, la dist-tag de npm y
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

Usa los flujos de trabajo de menor nivel `Plugin NPM Release` y `Plugin ClawHub Release`
solo para trabajos enfocados de reparación o republicación. Para una reparación de plugin seleccionada, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha el flujo de trabajo secundario directamente cuando el
paquete OpenClaw no debe publicarse.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo de 40 caracteres de la rama del flujo de trabajo actual para una preflight solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución de preflight correcta
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; por defecto es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución correcta de preflight de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw
- `plugin_publish_scope`: por defecto es `all-publishable`; usa `selected` solo
  para trabajo enfocado de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: por defecto es `true`; establécelo en `false` solo cuando uses el
  flujo de trabajo como orquestador de reparación solo de plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones que portan secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o una
  etiqueta de lanzamiento.
- `run_release_soak`: optar por una prueba prolongada exhaustiva en vivo/E2E, de ruta de lanzamiento de Docker y
  de supervivencia de actualización desde todas las versiones en comprobaciones de lanzamiento estables/predeterminadas. Se fuerza
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

## Secuencia de lanzamiento npm estable

Al preparar un lanzamiento npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo de la rama del flujo de trabajo actual
     para una ejecución de prueba solo de validación del flujo de trabajo de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de commit completo
   cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab,
   Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la referencia de lanzamiento en su lugar
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica plugins externalizados en npm
   y ClawHub antes de promocionar el paquete npm de OpenClaw
7. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promocionar esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir de inmediato la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autorreparación mueva `beta` más tarde

La mutación de dist-tags vive en el repositorio privado por seguridad porque aún
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a autenticación npm local, ejecuta cualquier comando de la CLI
de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
directamente desde el shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
alertas y el manejo de OTP sean observables y evita alertas repetidas del host.

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
