---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de la versión o la aceptación del paquete
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de comprobación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-05-07T15:08:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales de lanzamiento públicos:

- stable: versiones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: el puntero móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión npm estable promocionada actual
- `beta` significa el destino de instalación beta actual
- Las versiones estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest` o promocionar más tarde una compilación beta revisada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  las versiones beta normalmente validan y publican primero la ruta de npm/paquete, con
  la compilación/firma/notarización de la app para Mac reservada para versiones estables salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable continúa solo después de validar la beta más reciente
- Los mantenedores normalmente crean lanzamientos desde una rama `release/YYYY.M.D` creada
  desde el `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación es
  solo para mantenedores

## Lista de comprobación del operador de lanzamiento

Esta lista de comprobación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en
el runbook de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo último, confirma que el commit objetivo se ha enviado,
   y confirma que el CI del `main` actual está suficientemente en verde para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo y vuelve a hacer rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la compatibilidad caducada
   solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva
   intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas el trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista y luego ejecuta
   `pnpm release:prep`. Esto actualiza las versiones de plugins, el inventario de plugins, el esquema de configuración,
   los metadatos de configuración de canales incluidos, la línea base de documentación de configuración, las exportaciones del SDK de plugins
   y la línea base de API del SDK de plugins en el orden correcto. Haz commit de cualquier divergencia generada
   antes de etiquetar. Luego ejecuta la verificación previa determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento solo para validación
   previa. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA completo del commit. Este es el único punto de entrada manual
   para los cuatro grandes entornos de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo,
   canal, job de workflow, perfil de paquete, proveedor o lista de modelos permitidos fallidos más pequeños que
   prueben la corrección. Vuelve a ejecutar el contenedor completo solo cuando la superficie modificada vuelva
   obsoletas las pruebas anteriores.
9. Para beta, etiqueta `vYYYY.M.D-beta.N` y luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   despacha todos los paquetes de plugins publicables a npm y el mismo conjunto a
   ClawHub en paralelo, y luego promociona el artefacto preparado de verificación previa de npm de OpenClaw
   con el dist-tag correspondiente tan pronto como la publicación de plugins en npm tenga éxito.
   La publicación en ClawHub aún puede estar ejecutándose mientras OpenClaw se publica en npm, pero el
   workflow de publicación de lanzamiento imprime los IDs de ejecución secundarios de inmediato. De forma predeterminada,
   no espera a ClawHub después de despacharlo, por lo que la disponibilidad de OpenClaw en npm
   no queda bloqueada por aprobaciones o trabajo de registro de ClawHub más lentos; configura
   `wait_for_clawhub=true` cuando ClawHub deba bloquear la finalización del workflow. La
   ruta de ClawHub reintenta fallos transitorios de instalación de dependencias de CLI, publica
   plugins que pasan la vista previa aunque una celda de vista previa falle intermitentemente, y termina con
   verificación de registro para cada versión de plugin esperada, de modo que las publicaciones parciales
   sigan siendo visibles y reintentables. Después de publicar, ejecuta
   la aceptación de paquete posterior a la publicación
   contra el paquete publicado `openclaw@YYYY.M.D-beta.N` u
   `openclaw@beta`. Si un prelanzamiento enviado o publicado necesita una corrección,
   crea el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el prelanzamiento anterior.
10. Para stable, continúa solo después de que la beta revisada o la release candidate tenga la
    evidencia de validación requerida. La publicación estable en npm también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de verificación previa exitoso mediante
    `preflight_run_id`; la preparación de la versión estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador npm posterior a la publicación, el E2E opcional de Telegram
    de npm publicado independiente cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesaria, las notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Verificación previa de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa de la publicación para que el TypeScript de las pruebas siga
  cubierto fuera de la puerta local más rápida de `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa de la publicación para que las comprobaciones más amplias de ciclos de
  importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de publicación
  `dist/*` esperados y el paquete de Control UI existan para el paso de
  validación del empaquetado
- Ejecuta `pnpm release:prep` después del aumento de versión raíz y antes de etiquetar. Ejecuta
  todos los generadores deterministas de publicación que suelen desviarse después de un
  cambio de versión/configuración/API: versiones de plugins, inventario de plugins, esquema de
  configuración base, metadatos de configuración de canales incluidos, línea base de documentación de configuración, exportaciones de plugin SDK
  y línea base de API de plugin SDK. `pnpm release:check` vuelve a ejecutar esas
  protecciones en modo de comprobación e informa todos los fallos de deriva generada que encuentra en una
  sola pasada antes de ejecutar comprobaciones de publicación de paquetes.
- Ejecuta el flujo manual `Full Release Validation` antes de la aprobación de la publicación para
  iniciar todos los bancos de pruebas previos a la publicación desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para pruebas de instalación, aceptación de paquetes, comprobaciones de paquetes
  entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas
  mantienen las pruebas exhaustivas live/E2E y la prueba de larga duración de la ruta de publicación Docker detrás de
  `run_release_soak=true`; `release_profile=full` fuerza su activación. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta E2E de Telegram de paquete
  contra el artefacto `release-package-under-test` de las comprobaciones de publicación.
  Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo E2E de
  Telegram también deba probar el paquete npm publicado. Proporciona
  `package_acceptance_package_spec` después de publicar cuando Package Acceptance
  deba ejecutar su matriz de paquetes/actualización contra el paquete npm enviado en vez
  del artefacto construido desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba probar que la
  validación coincide con un paquete npm publicado sin forzar E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo manual `Package Acceptance` cuando quieras prueba por canal lateral
  para un candidato de paquete mientras continúa el trabajo de publicación. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de publicación; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de
  GitHub Actions. El flujo resuelve el candidato a
  `package-under-test`, reutiliza el programador de publicación Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles Docker
  seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona la
  línea base publicada. `update-restart-auth` usa el paquete candidato como
  la CLI instalada y como package-under-test para que ejercite la ruta de
  reinicio gestionado del comando de actualización del candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles de paquete/actualización/reinicio/plugin nativos del artefacto sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de publicación Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una reejecución focalizada
- Ejecuta el flujo manual `CI` directamente cuando solo necesites la cobertura completa de CI
  normal para el candidato de publicación. Los despachos manuales de CI omiten el
  alcance por cambios y fuerzan los shards de Linux Node, shards de plugins incluidos, contratos
  de canales, compatibilidad con Node 22, `check`, `check-additional`, prueba de build,
  comprobaciones de documentación, skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar telemetría de publicación. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de traza
  exportados, atributos acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro colector externo.
- Ejecuta `pnpm release:check` antes de cada publicación etiquetada
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación con mutaciones después de que
  exista la etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de publicación y el `preflight_run_id`
  exitoso de npm de OpenClaw, y conserva el alcance predeterminado de publicación de plugins
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación focalizada. El
  flujo serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw
  para que el paquete central no se publique antes que sus plugins externalizados.
- Las comprobaciones de publicación ahora se ejecutan en un flujo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad simulada de QA Lab más el perfil rápido
  live de Matrix y el carril de QA de Telegram antes de la aprobación de la publicación. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI.
  Ejecuta el flujo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte
  Matrix, medios y E2EE en paralelo.
- La validación en tiempo de ejecución de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  flujo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantener la ruta real de publicación npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su
  propio carril para que no ralenticen ni bloqueen la publicación
- Las comprobaciones de publicación que contienen secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de flujo `main`/release para que la lógica del flujo y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre
  que el commit resuelto sea alcanzable desde una rama o etiqueta de publicación de OpenClaw
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA actual
  completo de 40 caracteres del commit de la rama de flujo sin requerir una etiqueta enviada
- Esa ruta por SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta real de publicación
- Ambos flujos mantienen la publicación real y la ruta de promoción en runners hospedados por GitHub,
  mientras que la ruta de validación sin mutaciones puede usar los runners Linux
  más grandes de Blacksmith
- Ese flujo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa de publicación npm ya no espera al carril separado de comprobaciones de publicación
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y E2E real de Telegram
  contra el paquete npm publicado usando el conjunto compartido de credenciales de Telegram arrendadas.
  Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la prueba beta completa posterior a la publicación desde la máquina de un mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta validación de actualización npm de Parallels/objetivo nuevo, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del flujo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de publicación para mantenedores ahora usa verificación previa y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` de npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución exitosa de verificación previa
  - las publicaciones npm estables apuntan por defecto a `beta`
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante entrada de flujo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el
    repositorio público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una
    rama de publicación pero el flujo se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación mac privada real debe pasar `preflight_run_id` y `validate_run_id`
    de mac privada exitosos
  - las rutas reales de publicación promueven artefactos preparados en vez de reconstruirlos
    otra vez
- Para publicaciones estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de publicación no puedan dejar silenciosamente instalaciones globales antiguas con la
  carga estable base
- La verificación previa de publicación npm falla cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía de `dist/control-ui/assets/`
  para que no volvamos a enviar un panel del navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y
  los metadatos del paquete estén presentes en el diseño instalado del registro. Una publicación que
  envía cargas de runtime de plugins faltantes falla el verificador posterior a la publicación y
  no puede promoverse a `latest`.
- `pnpm test:install:smoke` también hace cumplir el presupuesto de `unpackedSize` del paquete npm sobre
  el tarball candidato de actualización, de modo que el e2e del instalador detecta el crecimiento accidental del paquete
  antes de la ruta de publicación
- Si el trabajo de publicación tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de publicación no
  describan un diseño de CI obsoleto
- La preparación de una publicación estable de macOS también incluye las superficies de actualización:
  - la publicación de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe conservar un id de paquete no de depuración, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle
    para esa versión de publicación

## Bancos de pruebas de publicación

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas a la publicación desde
un único punto de entrada. Para una prueba de commit fijado en una rama con mucho movimiento, usa el
helper para que cada flujo hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por
accidente una ejecución hija de `main` más reciente.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo de trabajo `main` de confianza y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El flujo de trabajo resuelve la referencia de destino, despacha el `CI` manual con `target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un artefacto padre `release-package-under-test` para las comprobaciones orientadas a paquetes y despacha el E2E independiente de Telegram del paquete cuando `release_profile=full` con `rerun_group=all` o cuando se define `npm_telegram_package_spec`. Luego `OpenClaw Release Checks` se despliega en pruebas de instalación, comprobaciones de lanzamiento multiplataforma, cobertura live/E2E de la ruta de lanzamiento de Docker cuando la prueba prolongada está habilitada, Package Acceptance con QA del paquete de Telegram, paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa solo es aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci` y `release_checks` como exitosos. En modo full/all, el hijo `npm_telegram` también debe ser exitoso; fuera de full/all se omite, salvo que se haya proporcionado un `npm_telegram_package_spec` publicado. El resumen final del verificador incluye tablas de trabajos más lentos para cada ejecución hija, para que el responsable del lanzamiento pueda ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la matriz completa de etapas, los nombres exactos de los trabajos del flujo de trabajo, las diferencias entre los perfiles stable y full, los artefactos y los identificadores de repetición enfocados.
Los flujos de trabajo hijos se despachan desde la referencia de confianza que ejecuta `Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una rama o etiqueta de lanzamiento anterior. No hay una entrada separada de referencia de flujo de trabajo para Full Release Validation; elige el arnés de confianza eligiendo la referencia de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` como prueba exacta de commit en una `main` en movimiento; los SHA de commit sin procesar no pueden ser referencias de despacho de flujo de trabajo, así que usa `pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: la ruta crítica de lanzamiento más rápida para OpenAI/core en vivo y Docker
- `stable`: minimum más cobertura estable de proveedores/backends para la aprobación del lanzamiento
- `full`: stable más cobertura amplia de proveedores/medios de aviso

Usa `run_release_soak=true` con `stable` cuando las líneas bloqueantes para el lanzamiento estén en verde y quieras la prueba exhaustiva live/E2E, la ruta de lanzamiento de Docker y el barrido acotado de supervivencia de actualización publicada antes de la promoción. Ese barrido cubre los cuatro paquetes stable más recientes, además de las líneas base fijadas `2026.4.23` y `2026.5.2`, más cobertura anterior de `2026.4.15`, con las líneas base duplicadas eliminadas y cada línea base fragmentada en su propio trabajo de ejecución de Docker. `full` implica `run_release_soak=true`.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia de destino una vez como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones multiplataforma, Package Acceptance y Docker de la ruta de lanzamiento cuando se ejecuta la prueba prolongada. Esto mantiene todas las máquinas orientadas a paquetes con los mismos bytes y evita compilaciones repetidas de paquetes.
La prueba de instalación multiplataforma de OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la variable de repo/org está definida; de lo contrario, usa `openai/gpt-5.4`, porque esta línea demuestra la instalación del paquete, el onboarding, el inicio del Gateway y un turno de agente en vivo, en lugar de comparar el modelo predeterminado más lento. La matriz más amplia de proveedores en vivo sigue siendo el lugar para la cobertura específica de modelos.

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

No uses el paraguas completo como la primera repetición después de una corrección enfocada. Si falla una máquina, usa el flujo de trabajo hijo, el trabajo, la línea de Docker, el perfil de paquete, el proveedor de modelo o la línea de QA fallidos para la siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando la corrección haya cambiado la orquestación compartida de lanzamiento o haya vuelto obsoleta la evidencia anterior de todas las máquinas. El verificador final del paraguas vuelve a comprobar los identificadores registrados de las ejecuciones de flujos de trabajo hijos, así que después de repetir correctamente un flujo de trabajo hijo, repite solo el trabajo padre `Verify full validation` fallido.

Para una recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real de candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease` ejecuta solo el hijo de Plugin exclusivo de lanzamiento, `release-checks` ejecuta todas las máquinas de lanzamiento, y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las repeticiones enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all con `release_profile=full` usan el artefacto de paquete de release-checks. Las repeticiones enfocadas multiplataforma pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de SO/suite. Los fallos de QA en release-checks son consultivos; un fallo solo de QA no bloquea la validación del lanzamiento.

### Vitest

La máquina de Vitest es el flujo de trabajo hijo `CI` manual. El CI manual omite intencionalmente el alcance por cambios y fuerza el grafo normal de pruebas para el candidato de lanzamiento: fragmentos de Linux Node, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, prueba de build, comprobaciones de documentación, Skills de Python, Windows, macOS, Android y la i18n de Control UI.

Usa esta máquina para responder “¿el árbol de código fuente pasó la suite completa normal de pruebas?”. No es lo mismo que la validación de producto de la ruta de lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` en verde en el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesite CI normal determinista, pero no las máquinas de Docker, QA Lab, live, multiplataforma o paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La máquina de Docker vive en `OpenClaw Release Checks` a través de `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo de lanzamiento. Valida el candidato de lanzamiento mediante entornos Docker empaquetados, no solo pruebas a nivel de código fuente.

La cobertura de Docker de lanzamiento incluye:

- prueba completa de instalación con la prueba lenta de instalación global de Bun habilitada
- preparación/reutilización de imagen de prueba del Dockerfile raíz por SHA de destino, con trabajos de QR, root/gateway e installer/Bun ejecutándose como fragmentos separados de install-smoke
- líneas E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- líneas divididas de instalación/desinstalación de plugins incluidos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- suites de proveedores live/E2E y cobertura de modelos en vivo de Docker cuando las comprobaciones de lanzamiento incluyen suites en vivo

Usa los artefactos de Docker antes de repetir. El programador de ruta de lanzamiento sube `.artifacts/docker-tests/` con registros de líneas, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador y comandos de repetición. Para una recuperación enfocada, usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de repetir todos los fragmentos de lanzamiento. Los comandos de repetición generados incluyen el `package_artifact_run_id` anterior y las entradas de imágenes Docker preparadas cuando están disponibles, para que una línea fallida pueda reutilizar el mismo tarball y las mismas imágenes GHCR.

### QA Lab

La máquina de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento de comportamiento agéntico y nivel de canales, separada de Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab de lanzamiento incluye:

- línea de paridad mock que compara la línea candidata de OpenAI con la línea base de Opus 4.6 usando el paquete de paridad agéntica
- perfil rápido de QA de Matrix en vivo usando el entorno `qa-live-shared`
- línea de QA de Telegram en vivo usando arrendamientos de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta máquina para responder “¿el lanzamiento se comporta correctamente en escenarios de QA y flujos de canales en vivo?”. Conserva las URL de artefactos para las líneas de paridad, Matrix y Telegram al aprobar el lanzamiento. La cobertura completa de Matrix sigue estando disponible como una ejecución manual fragmentada de QA-Lab, no como la línea crítica predeterminada de lanzamiento.

### Paquete

La máquina de paquete es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un candidato en el tarball `package-under-test` consumido por Docker E2E, valida el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene la referencia del arnés del flujo de trabajo separada de la referencia fuente del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA completo de commit de `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el artefacto preparado del paquete de lanzamiento, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la actualización, el reinicio de actualización con auth configurada, la limpieza de dependencias obsoletas de plugins, las fixtures de plugins sin conexión, la actualización de plugins y la QA del paquete de Telegram contra el mismo tarball resuelto. Las comprobaciones de lanzamiento bloqueantes usan la línea base predeterminada del paquete publicado más reciente; `run_release_soak=true` o `release_profile=full` se expande a todas las líneas base stable publicadas en npm desde `2026.4.23` hasta `latest`, más fixtures de incidencias reportadas. Usa Package Acceptance con `source=npm` para un candidato ya publicado, o `source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes de publicar. Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de lanzamiento multiplataforma siguen importando para el onboarding, el instalador y el comportamiento específicos de cada SO, pero la validación de producto de paquetes/actualizaciones debe preferir Package Acceptance.

La lista de verificación canónica para la validación de actualizaciones y plugins es [Probar actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al decidir qué línea local, Docker, Package Acceptance o release-check demuestra un cambio de instalación/actualización de plugins, limpieza de doctor o migración de paquete publicado.
La migración exhaustiva de actualizaciones publicadas desde cada paquete stable `2026.4.23+` es un flujo de trabajo manual separado `Update Migration`, no parte de Full Release CI.

La flexibilidad heredada de aceptación de paquetes está intencionalmente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas
en npm: entradas privadas del inventario de QA ausentes del tarball, ausencia de
`gateway install --wrapper`, ausencia de archivos de parche en el fixture de git derivado del tarball,
ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins,
ausencia de persistencia de registros de instalación del marketplace y migración de metadatos de configuración
durante `plugins update`. El paquete publicado `2026.4.26` puede advertir
sobre archivos de marca de metadatos de compilación local que ya se distribuyeron. Los paquetes posteriores
deben satisfacer los contratos modernos de paquetes; esas mismas brechas fallan la validación de release.

Usa perfiles más amplios de Package Acceptance cuando la pregunta del release trate sobre un
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

- `smoke`: lanes rápidos de instalación de paquete/canal/agente, red de Gateway y recarga
  de configuración
- `package`: contratos de instalación/actualización/reinicio/paquete de Plugin sin ClawHub
  en vivo; este es el valor predeterminado de la comprobación de release
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos de ruta de release de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram de un paquete candidato, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball
resuelto de `package-under-test` al lane de Telegram; el flujo de trabajo independiente de
Telegram todavía acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de release

`OpenClaw Release Publish` es el punto de entrada mutante normal de publicación. Orquesta
los flujos de trabajo de publicador de confianza en el orden que necesita el release:

1. Hacer checkout de la etiqueta de release y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de release, la dist-tag de npm y
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
solo para trabajos enfocados de reparación o republicación. Para reparar un Plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha el flujo de trabajo hijo directamente cuando el
paquete OpenClaw no deba publicarse.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de release obligatoria, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo actual de 40 caracteres de la rama del flujo de trabajo para una comprobación preflight
  solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución preflight exitosa
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de release obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución preflight exitosa de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo cuando uses el
  flujo de trabajo como orquestador de reparación solo de plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo que validar. Las comprobaciones que contienen secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  una etiqueta de release.
- `run_release_soak`: optar por pruebas exhaustivas en vivo/E2E, ruta de release de Docker y
  soak de upgrade-survivor desde todas las versiones en comprobaciones de release estables/predeterminadas. Se fuerza
  con `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicar en `beta` o `latest`
- Las etiquetas beta de prerelease solo pueden publicar en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante preflight;
  el flujo de trabajo verifica esos metadatos antes de que continúe la publicación

## Secuencia de release estable de npm

Al preparar un release estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo actual de la rama
     del flujo de trabajo para una ejecución de prueba solo de validación del flujo de trabajo preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando intencionalmente quieras una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de release, la etiqueta de release o el SHA de
   commit completo cuando quieras CI normal más cobertura de caché de prompt en vivo, Docker, QA Lab,
   Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la ref de release en su lugar
5. Guarda el `preflight_run_id` exitoso
6. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica los plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el release aterrizó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el release se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir la misma compilación estable de inmediato, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autocorrección mueva `beta` más tarde

La mutación de dist-tags vive en el repo privado por seguridad, porque todavía
requiere `NPM_TOKEN`, mientras que el repo público mantiene publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la CLI
de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
directamente desde la shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
alertas y manejo de OTP sean observables, y evita alertas repetidas del host.

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

Los mantenedores usan la documentación privada de releases en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.

## Relacionado

- [Canales de release](/es/install/development-channels)
