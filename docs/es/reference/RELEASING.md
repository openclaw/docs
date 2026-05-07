---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de lanzamiento o de la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
    - Planificación de líneas de lanzamiento de soporte mensual o LTS
summary: Canales de lanzamiento, lista de verificación del operador, cuadros de validación, nomenclatura de versiones, líneas de soporte mensual planificadas y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-07T01:53:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales de lanzamiento públicos:

- estable: versiones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- desarrollo: el encabezado móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable heredada: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión estable npm promovida actual
- `beta` significa el destino de instalación beta actual
- Las versiones estables y de corrección heredadas se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más tarde una compilación beta validada
- Cada versión estable de OpenClaw entrega el paquete npm y la aplicación para macOS juntos;
  las versiones beta normalmente validan y publican primero la ruta npm/paquete, con la
  compilación/firma/notarización de la aplicación para Mac reservada para estable salvo que se solicite explícitamente

### Versionado planificado de soporte mensual

OpenClaw aún no tiene un canal LTS ni de soporte mensual. Los mantenedores están
trabajando hacia líneas de soporte mensual compatibles con SemVer, pero los canales
de actualización entregados hoy siguen siendo `stable`, `beta` y `dev`.

La forma de versión planificada es `YYYY.M.PATCH`:

- `YYYY` es el año.
- `M` es la línea de lanzamiento mensual, sin cero inicial.
- `PATCH` se incrementa dentro de esa línea mensual y puede crecer tanto como sea necesario.

Por ejemplo, `2026.6.0`, `2026.6.1` y `2026.6.2` estarían todos en la línea de junio
de 2026. Una futura etiqueta dist-tag de soporte mensual como `stable-2026-6` o
`lts-2026-6` puede apuntar a esa línea, mientras `latest` sigue avanzando rápido.

Este modelo futuro reemplaza la necesidad de nuevas versiones de corrección
`YYYY.M.D-N`. Las versiones de corrección heredadas existentes siguen reconociéndose
para que los paquetes más antiguos y las rutas de actualización sigan funcionando.

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente preparan lanzamientos desde una rama `release/YYYY.M.D` creada
  desde el `main` actual, de modo que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si se ha subido o publicado una etiqueta beta y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el manual de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo más reciente, confirma que el commit objetivo se haya subido,
   y confirma que el CI del `main` actual esté lo bastante verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, súbelo, y rebasea/trae
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina compatibilidad vencida
   solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva
   intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes de Plugin publicables compartan la versión de lanzamiento
   y los metadatos de compatibilidad, luego ejecuta la precomprobación determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento solo para validación
   de precomprobación. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA completo del commit. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, canal,
   trabajo de workflow, perfil de paquete, proveedor o lista de permitidos de modelos fallido más pequeño
   que demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada vuelva obsoleta
   la evidencia anterior.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   despacha todos los paquetes de Plugin publicables a npm y el mismo conjunto a
   ClawHub en paralelo, y luego promueve el artefacto de precomprobación npm preparado de OpenClaw
   con el dist-tag correspondiente en cuanto la publicación npm del Plugin tenga éxito.
   La publicación en ClawHub todavía puede estar ejecutándose mientras OpenClaw npm se publica, pero el
   workflow de publicación de lanzamiento no termina hasta que ambas rutas de publicación de Plugin y
   la ruta de publicación npm de OpenClaw se hayan completado correctamente. Después de publicar, ejecuta
   la aceptación de paquete posterior a la publicación
   contra el paquete publicado `openclaw@YYYY.M.D-beta.N` u
   `openclaw@beta`. Si un prelanzamiento subido o publicado necesita una corrección,
   crea el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el
   prelanzamiento anterior.
10. Para estable, continúa solo después de que la beta validada o la candidata de lanzamiento tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de precomprobación exitoso mediante
    `preflight_run_id`; la preparación de la versión macOS estable también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador npm posterior a la publicación, el E2E opcional de Telegram
    publicado-npm independiente cuando necesites prueba del canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, las notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio de lanzamiento.

## Precomprobación de lanzamiento

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que el TypeScript de las pruebas siga
  cubierto fuera de la puerta local más rápida de `pnpm check`
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de lanzamiento
  `dist/*` esperados y el bundle de Control UI para el paso de validación
  del paquete
- Ejecuta `pnpm plugins:sync` después del aumento de versión raíz y antes de etiquetar. Actualiza las versiones de paquetes de plugins publicables, los metadatos de compatibilidad peer/API de OpenClaw, los metadatos de compilación y los stubs de changelog de plugins para que coincidan con la versión de lanzamiento del núcleo. `pnpm plugins:sync:check` es la guarda de lanzamiento no mutante; el flujo de publicación falla antes de cualquier mutación de registro si se olvidó este paso.
- Ejecuta el workflow manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todos los test boxes previos al lanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para humo de instalación, aceptación de paquete, comprobaciones de paquetes cross-OS, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas
  mantienen el soak exhaustivo live/E2E y de ruta de lanzamiento Docker detrás de
  `run_release_soak=true`; `release_profile=full` fuerza el soak. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta E2E de paquete Telegram
  contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento.
  Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo
  E2E de Telegram también deba probar el paquete npm publicado. Proporciona
  `package_acceptance_package_spec` después de publicar cuando Package Acceptance
  deba ejecutar su matriz de paquete/actualización contra el paquete npm enviado en lugar
  del artefacto compilado desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba probar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el workflow manual `Package Acceptance` cuando quieras evidencia de canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 requerido; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El workflow resuelve el candidato en
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles Docker
  seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada. `update-restart-auth` usa el paquete candidato como
  la CLI instalada y el package-under-test para que ejercite la ruta de reinicio
  gestionado del comando de actualización candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles de paquete/actualización/reinicio/plugin nativos del artefacto sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta el workflow manual `CI` directamente cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el
  acotamiento por cambios y fuerzan los shards Linux Node, shards de plugins incluidos,
  contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, humo de compilación,
  comprobaciones de docs, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor local OTLP/HTTP y verifica los nombres de spans
  de traza exportados, atributos acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro recolector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que
  exista la etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento y el
  `preflight_run_id` exitoso de npm de OpenClaw, y conserva el alcance predeterminado de publicación de plugins
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El
  workflow serializa la publicación npm de plugins, la publicación ClawHub de plugins y la publicación npm de OpenClaw
  para que el paquete núcleo no se publique antes de sus plugins externalizados.
- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil rápido
  live de Matrix y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa arriendos de credenciales de Convex CI.
  Ejecuta el workflow manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte,
  medios y E2EE de Matrix en paralelo.
- La validación en tiempo de ejecución de instalación y actualización cross-OS forma parte de los
  `OpenClaw Release Checks` públicos y de `Full Release Validation`, que llaman
  directamente al workflow reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su
  propio carril para que no atasquen ni bloqueen la publicación
- Las comprobaciones de lanzamiento que llevan secretos deben despacharse mediante `Full Release
Validation` o desde la ref de workflow `main`/release para que la lógica del workflow y los
  secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o etiqueta de lanzamiento
- El preflight solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual
  de 40 caracteres del commit de la rama de workflow sin requerir una etiqueta enviada
- Esa ruta de SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la
  comprobación de metadatos de paquete; la publicación real sigue requiriendo una etiqueta real de lanzamiento
- Ambos workflows mantienen la publicación real y la ruta de promoción en runners alojados por GitHub,
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
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales arrendadas de Telegram.
  Los one-offs locales de maintainers pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a publicación desde una máquina de maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta validación de actualización npm de Parallels/objetivo nuevo, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del workflow, descarga el artefacto e imprime el informe de Telegram.
- Los maintainers pueden ejecutar la misma comprobación posterior a publicación desde GitHub Actions mediante el
  workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento de maintainers ahora usa preflight y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución de preflight exitosa
  - los lanzamientos npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante input del workflow
  - la mutación basada en token de npm dist-tag ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el
    repo público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una
    rama de lanzamiento pero el workflow se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe pasar un
    `preflight_run_id` y `validate_run_id` privados de mac exitosos
  - las rutas de publicación reales promocionan artefactos preparados en lugar de volver a compilarlos
- Para lanzamientos heredados de corrección estable como `YYYY.M.D-N`, el verificador posterior a publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales más antiguas en la
  carga estable base
- El preflight de lanzamiento npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía de `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a publicación también comprueba que los entrypoints de plugins publicados y
  los metadatos de paquete estén presentes en el layout del registro instalado. Un lanzamiento que
  envíe cargas de runtime de plugins faltantes falla el verificador postpublish y
  no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` de npm pack al
  tarball candidato de actualización, de modo que el e2e del instalador detecte bloat accidental del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de timing de extensiones o
  matrices de pruebas de extensiones, regenera y revisa los outputs de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un layout de CI obsoleto
- La preparación de lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe mantener un bundle id no de depuración, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de compilación Sparkle
    para esa versión de lanzamiento

## Test boxes de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama que se mueve rápido, usa el
helper para que cada workflow hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de workflow hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija más nueva de `main`.

Para validación de rama o etiqueta de lanzamiento, ejecútala desde la ref de workflow `main` de confianza
y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El workflow resuelve la ref de destino, despacha el `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto padre `release-package-under-test` para las comprobaciones orientadas
a paquetes y despacha el E2E independiente de Telegram para paquetes cuando
`release_profile=full` con `rerun_group=all` o cuando se define
`npm_telegram_package_spec`. Luego `OpenClaw Release
Checks` se distribuye en pruebas de humo de instalación, comprobaciones de
release entre sistemas operativos, cobertura de rutas de release live/E2E de
Docker cuando soak está habilitado, Package Acceptance con QA de paquetes de
Telegram, paridad de QA Lab, Matrix live y Telegram live. Una ejecución completa solo es aceptable cuando el
resumen de `Full Release Validation`
muestra `normal_ci` y `release_checks` como correctos. En modo full/all,
el hijo `npm_telegram` también debe completarse correctamente; fuera de full/all se omite
salvo que se haya proporcionado un `npm_telegram_package_spec` publicado. El resumen final del
verificador incluye tablas de los trabajos más lentos para cada ejecución hija, de modo que el gestor de release
pueda ver la ruta crítica actual sin descargar logs.
Consulta [Validación completa de release](/es/reference/full-release-validation) para ver la
matriz completa de etapas, los nombres exactos de jobs del workflow, las
diferencias entre los perfiles stable y full, artefactos y manejadores de repetición enfocados.
Los workflows hijos se despachan desde la ref confiable que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una
rama o etiqueta de release anterior. No hay una entrada workflow-ref separada para Full Release Validation;
elige el arnés confiable eligiendo la ref de ejecución del workflow.
No uses `--ref main -f ref=<sha>` para prueba exacta de commit en un `main` móvil;
los SHA de commit sin procesar no pueden ser refs de despacho de workflow, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: la ruta crítica de release más rápida para OpenAI/core live y Docker
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de release
- `full`: stable más cobertura amplia de proveedor/media advisory

Usa `run_release_soak=true` con `stable` cuando las vías bloqueantes de release estén
verdes y quieras el barrido exhaustivo live/E2E, de ruta de release de Docker y
acotado de supervivencia de upgrades publicados antes de la promoción. Ese barrido cubre
los últimos cuatro paquetes estables más las líneas base fijadas `2026.4.23` y `2026.5.2`
más cobertura anterior de `2026.4.15`, con líneas base duplicadas eliminadas y
cada línea base fragmentada en su propio job runner de Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa la ref confiable del workflow para resolver la ref de destino
una vez como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones
entre sistemas operativos, Package Acceptance y Docker de ruta de release cuando se ejecuta soak. Esto mantiene
todas las máquinas orientadas a paquetes sobre los mismos bytes y evita compilaciones de paquetes repetidas.
La prueba de humo de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/org está definida; de lo contrario, `openai/gpt-5.4`, porque esta vía está
probando la instalación del paquete, el onboarding, el arranque del gateway y un turno live de agente,
no midiendo el rendimiento del modelo predeterminado más lento. La matriz live más amplia de proveedores
sigue siendo el lugar para la cobertura específica de modelos.

Usa estas variantes según la etapa del release:

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

No uses el paraguas completo como primera repetición tras una corrección enfocada. Si falla una máquina,
usa el workflow hijo, job, vía de Docker, perfil de paquete, proveedor de modelo
o vía de QA que falló para la siguiente prueba. Ejecuta el paraguas completo de nuevo solo cuando
la corrección cambió la orquestación compartida de release o volvió obsoleta la evidencia previa de todas las máquinas.
El verificador final del paraguas vuelve a comprobar los ids registrados de ejecución de workflows hijos,
así que después de repetir correctamente un workflow hijo, repite solo el job padre
`Verify full validation` fallido.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
del candidato de release, `ci` ejecuta solo el hijo normal de CI, `plugin-prerelease`
ejecuta solo el hijo de Plugin exclusivo del release, `release-checks` ejecuta todas las
máquinas de release, y los grupos de release más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las repeticiones enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all
con `release_profile=full` usan el artefacto de paquete de release-checks. Las repeticiones enfocadas
entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u
otro filtro de sistema operativo/suite. Los fallos de QA en release-check son advisory; un fallo solo de QA
no bloquea la validación del release.

### Vitest

La máquina de Vitest es el workflow hijo `CI` manual. CI manual omite
intencionadamente el alcance por cambios y fuerza el grafo normal de pruebas para el candidato de release:
fragmentos de Linux Node, fragmentos de Plugin incluido, contratos de canales, compatibilidad con Node 22,
`check`, `check-additional`, humo de build, comprobaciones de documentación, Python
skills, Windows, macOS, Android y Control UI i18n.

Usa esta máquina para responder "¿el árbol de fuentes pasó la suite normal completa de pruebas?"
No es lo mismo que la validación de producto en ruta de release. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de ejecución de `CI` despachada
- ejecución de `CI` verde en el SHA exacto de destino
- nombres de fragmentos fallidos o lentos de los jobs de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el release necesita CI normal determinista pero
no las máquinas de Docker, QA Lab, live, entre sistemas operativos o paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La máquina de Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del workflow `install-smoke`
en modo release. Valida el candidato de release mediante entornos Docker empaquetados
en vez de solo pruebas a nivel de fuente.

La cobertura Docker del release incluye:

- humo de instalación completo con la prueba de humo lenta de instalación global de Bun habilitada
- preparación/reutilización de imagen de humo del Dockerfile raíz por SHA de destino, con jobs de humo de QR,
  root/gateway e instalador/Bun ejecutándose como fragmentos separados de install-smoke
- vías E2E del repositorio
- fragmentos Docker de ruta de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- vías divididas de instalación/desinstalación de Plugin incluido
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites de proveedor live/E2E y cobertura de modelos live en Docker cuando las comprobaciones de release
  incluyen suites live

Usa los artefactos de Docker antes de repetir. El programador de ruta de release sube
`.artifacts/docker-tests/` con logs de vías, `summary.json`, `failures.json`,
tiempos de fases, JSON del plan del programador y comandos de repetición. Para recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el workflow reutilizable live/E2E en lugar de
repetir todos los fragmentos de release. Los comandos de repetición generados incluyen entradas previas de
`package_artifact_run_id` y de imágenes Docker preparadas cuando están disponibles, así que una
vía fallida puede reutilizar el mismo tarball y las mismas imágenes de GHCR.

### QA Lab

La máquina de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de release de
comportamiento agentic y a nivel de canal, separada de Vitest y de la
mecánica de paquetes de Docker.

La cobertura de QA Lab de release incluye:

- vía de paridad mock que compara la vía candidata de OpenAI contra la línea base de Opus 4.6
  usando el paquete de paridad agentic
- perfil rápido de QA de Matrix live usando el entorno `qa-live-shared`
- vía de QA de Telegram live usando concesiones de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de release necesita prueba local explícita

Usa esta máquina para responder "¿el release se comporta correctamente en escenarios de QA y
flujos de canales live?" Conserva las URL de artefactos para las vías de paridad, Matrix y Telegram
al aprobar el release. La cobertura completa de Matrix sigue disponible como una
ejecución manual fragmentada de QA-Lab en lugar de la vía crítica predeterminada del release.

### Package

La máquina Package es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolver
`scripts/resolve-openclaw-package-candidate.mjs`. El resolver normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y SHA-256, y mantiene la
ref del arnés de workflow separada de la ref de origen del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA completo de commit de `package_ref` confiable
  con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` obligatorio
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto preparado de paquete de release, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migración, actualización,
reinicio de actualización con autenticación configurada, limpieza de dependencias obsoletas de Plugin, fixtures de Plugin offline,
actualización de Plugin y QA de paquete de Telegram contra el mismo tarball resuelto.
Las comprobaciones de release bloqueantes usan la línea base predeterminada del último paquete publicado;
`run_release_soak=true` o
`release_profile=full` se expande a todas las líneas base estables publicadas en npm desde
`2026.4.23` hasta `latest` más fixtures de issues reportados. Usa
Package Acceptance con `source=npm` para un candidato ya distribuido, o
`source=ref`/`source=artifact` para un tarball local de npm respaldado por SHA antes de
publicar. Es el reemplazo nativo de GitHub
para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería
Parallels. Las comprobaciones de release entre sistemas operativos siguen importando para onboarding,
instalador y comportamiento específico de plataforma, pero la validación de producto de paquetes/actualizaciones debería
preferir Package Acceptance.

La lista de verificación canónica para validación de actualizaciones y plugins es
[Prueba de actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué vía local, Docker, Package Acceptance o release-check prueba un
cambio de instalación/actualización de Plugin, limpieza de doctor o migración de paquete publicado.
La migración exhaustiva de actualización publicada desde todos los paquetes estables `2026.4.23+` es
un workflow manual separado `Update Migration`, no parte de Full Release CI.

La flexibilidad heredada de aceptación de paquetes está intencionalmente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas
en npm: entradas privadas del inventario de QA ausentes en el tarball, ausencia de
`gateway install --wrapper`, archivos de parche ausentes en el fixture de git derivado
del tarball, ausencia de `update.channel` persistido, ubicaciones heredadas de registros
de instalación de Plugin, ausencia de persistencia de registros de instalación del marketplace
y migración de metadatos de configuración durante `plugins update`. El paquete publicado
`2026.4.26` puede advertir sobre archivos locales de sello de metadatos de compilación que ya
se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes;
esas mismas brechas hacen fallar la validación de lanzamiento.

Usa perfiles de Package Acceptance más amplios cuando la pregunta de lanzamiento trate sobre un
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
- `package`: contratos de instalación/actualización/reinicio/paquete de Plugin sin ClawHub
  en vivo; este es el valor predeterminado de comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram de un paquete candidato, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El workflow pasa el tarball
resuelto de `package-under-test` al carril de Telegram; el workflow independiente de
Telegram sigue aceptando una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamientos

`OpenClaw Release Publish` es el punto de entrada mutador normal para publicar. Orquesta
los workflows de publicador de confianza en el orden que necesita el lanzamiento:

1. Hacer checkout de la etiqueta de lanzamiento y resolver su SHA de commit.
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

Usa los workflows de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release`
solo para trabajos enfocados de reparación o republicación. Para una reparación de Plugin
seleccionado, pasa `plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha el workflow hijo directamente cuando el paquete
OpenClaw no deba publicarse.

## Entradas del workflow de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo de 40 caracteres de la rama de workflow actual para preflight solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el workflow reutilice
  el tarball preparado desde la ejecución de preflight correcta
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución de preflight correcto de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta npm de destino para el paquete OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquete `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo cuando uses el
  workflow como orquestador de reparación solo para Plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones con secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  una etiqueta de lanzamiento.
- `run_release_soak`: optar por la prueba exhaustiva en vivo/E2E, ruta de lanzamiento de Docker y
  soak de superviviente de actualización desde todos los lanzamientos anteriores en comprobaciones de lanzamiento estable/predeterminado. Se fuerza
  con `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas beta de prelanzamiento solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante el preflight;
  el workflow verifica esos metadatos antes de que continúe la publicación

## Secuencia de lanzamiento estable de npm

Al cortar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo de la rama de workflow actual
     para un simulacro solo de validación del workflow de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de commit completo
   cuando quieras CI normal más caché de prompts en vivo, Docker, QA Lab,
   Matrix y cobertura de Telegram desde un workflow manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   workflow manual `CI` en la ref de lanzamiento
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica Plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el lanzamiento aterrizó en `beta`, usa el workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir de inmediato la misma compilación estable, usa ese mismo workflow privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización
   programada de autorreparación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque aún
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación npm local, ejecuta cualquier comando de la CLI
de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
directamente desde la shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
alertas y manejo de OTP sean observables y evita alertas repetidas del host.

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
