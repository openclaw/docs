---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de la versión o la aceptación del paquete
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, cuadros de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-12T08:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres carriles de lanzamiento públicos:

- estable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- desarrollo: la cabeza móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa el lanzamiento estable actual promovido en npm
- `beta` significa el destino actual de instalación beta
- Los lanzamientos estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más tarde una compilación beta revisada
- Cada lanzamiento estable de OpenClaw incluye conjuntamente el paquete npm y la app para macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, con
  la compilación/firma/notarización de la app para Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Estable llega solo después de validar la beta más reciente
- Los mantenedores normalmente cortan lanzamientos desde una rama `release/YYYY.M.D` creada
  desde el `main` actual, de modo que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores cortan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para mantenedores

## Lista de comprobación del operador de lanzamiento

Esta lista de comprobación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en
el runbook de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo más reciente, confirma que el commit objetivo se ha enviado,
   y confirma que la CI actual de `main` está lo bastante verde como para ramificar desde ahí.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, súbelo, y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la
   compatibilidad vencida solo cuando la ruta de actualización siga cubierta, o registra por qué se
   mantiene intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas el trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, luego ejecuta
   `pnpm release:prep`. Actualiza versiones de plugins, inventario de plugins, esquema de
   configuración, metadatos de configuración de canales incluidos, baseline de documentación de configuración,
   exportaciones del SDK de plugins y baseline de API del SDK de plugins en el orden correcto. Haz commit de cualquier
   deriva generada antes de etiquetar. Luego ejecuta el preflight determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento para el preflight
   solo de validación. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA completo del commit. Este es el único punto de entrada manual
   para los cuatro grandes cuadros de pruebas de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo,
   carril, job de workflow, perfil de paquete, proveedor o allowlist de modelos más pequeño que
   pruebe la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie modificada vuelva
   obsoleta la evidencia previa.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   despacha todos los paquetes de plugins publicables a npm y el mismo conjunto a
   ClawHub en paralelo, y luego promueve el artefacto de preflight npm preparado de OpenClaw
   con el dist-tag correspondiente en cuanto la publicación npm de plugins tiene éxito.
   Después de que el hijo de publicación npm de OpenClaw tiene éxito, crea o actualiza la
   página de lanzamiento/prelanzamiento de GitHub correspondiente desde la sección completa correspondiente de
   `CHANGELOG.md`. Los lanzamientos estables publicados en npm `latest` se convierten en el
   último lanzamiento de GitHub; los lanzamientos de mantenimiento estable mantenidos en npm `beta` se
   crean con GitHub `latest=false`.
   La publicación en ClawHub todavía puede estar ejecutándose mientras OpenClaw se publica en npm, pero el
   workflow de publicación de lanzamiento imprime los ID de ejecución hijos de inmediato. De forma predeterminada,
   no espera a ClawHub después de despacharlo, por lo que la disponibilidad npm de OpenClaw
   no queda bloqueada por aprobaciones o trabajo de registro más lentos en ClawHub; establece
   `wait_for_clawhub=true` cuando ClawHub deba bloquear la finalización del workflow. La
   ruta de ClawHub reintenta fallos transitorios de instalación de dependencias de la CLI, publica
   plugins que pasan la vista previa incluso cuando una celda de vista previa falla intermitentemente, y termina con
   verificación de registro para cada versión de plugin esperada, de modo que las publicaciones parciales
   sigan siendo visibles y reintentables. Después de publicar, ejecuta
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   para verificar desde un solo comando el prelanzamiento de GitHub, los dist-tags npm `beta`, la integridad npm,
   la ruta de instalación publicada, las versiones exactas en ClawHub, los artefactos de ClawHub y las conclusiones de
   los workflows hijos. Añade `--rerun-failed-clawhub` cuando el
   sidecar de ClawHub haya fallado solo en jobs reintentables y deba volver a ejecutarse in situ.
   Luego ejecuta la aceptación de paquete posterior a la publicación contra el paquete publicado
   `openclaw@YYYY.M.D-beta.N` u
   `openclaw@beta`. Si un prelanzamiento enviado o publicado necesita una corrección,
   corta el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el prelanzamiento anterior.
10. Para estable, continúa solo después de que la beta revisada o la candidata de lanzamiento tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de preflight exitoso mediante
    `preflight_run_id`; la preparación del lanzamiento estable para macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
    El workflow privado de publicación para macOS publica automáticamente el appcast firmado en el
    `main` público después de verificar los activos de lanzamiento; si la protección de rama bloquea
    el envío directo, abre o actualiza un PR de appcast.
11. Después de publicar, ejecuta el verificador npm posterior a la publicación, el E2E independiente opcional de Telegram
    con npm publicado cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesaria, verifica la página de lanzamiento de GitHub generada,
    y ejecuta los pasos de anuncio del lanzamiento.

## Preflight de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la comprobación previa de la versión para que el TypeScript de pruebas quede cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la comprobación previa de la versión para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de versión esperados `dist/*` y el paquete de Control UI para el paso de validación de empaquetado
- Ejecuta `pnpm release:prep` después del aumento de versión raíz y antes de etiquetar. Ejecuta todos los generadores deterministas de versión que suelen desviarse después de un cambio de versión/configuración/API: versiones de plugins, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, línea base de documentación de configuración, exportaciones del SDK de plugins y línea base de API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas defensas en modo de comprobación y reporta todos los fallos de deriva generada que encuentra en una sola pasada antes de ejecutar las comprobaciones de publicación de paquetes.
- Ejecuta el workflow manual `Full Release Validation` antes de aprobar la versión para iniciar todos los entornos de prueba previos a la versión desde un único punto de entrada. Acepta una rama, una etiqueta o un SHA completo de commit, lanza manualmente `CI` y lanza `OpenClaw Release Checks` para install smoke, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas mantienen las pruebas exhaustivas live/E2E y la prueba prolongada de la ruta de versión de Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza la prueba prolongada. Con `release_profile=full` y `rerun_group=all`, también ejecuta Telegram E2E de paquete contra el artefacto `release-package-under-test` de las comprobaciones de versión. Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete npm publicado en las comprobaciones de versión, Package Acceptance y Telegram E2E de paquete sin reconstruir el tarball de versión. Proporciona `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado distinto al del resto de la validación de versión. Proporciona `package_acceptance_package_spec` cuando Package Acceptance deba usar un paquete publicado distinto al spec del paquete de versión. Proporciona `evidence_package_spec` cuando el informe privado de evidencia deba probar que la validación coincide con un paquete npm publicado sin forzar Telegram E2E.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el workflow manual `Package Acceptance` cuando quieras una prueba por canal lateral para un candidato de paquete mientras continúa el trabajo de versión. Usa `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión exacta de publicación; `source=ref` para empaquetar una rama/etiqueta/SHA confiable de `package_ref` con el arnés actual de `workflow_ref`; `source=url` para un tarball HTTPS con SHA-256 requerido; o `source=artifact` para un tarball subido por otra ejecución de GitHub Actions. El workflow resuelve el candidato a `package-under-test`, reutiliza el programador de versiones Docker E2E contra ese tarball y puede ejecutar QA de Telegram contra el mismo tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada. `update-restart-auth` usa el paquete candidato tanto como la CLI instalada como el package-under-test, por lo que ejercita la ruta de reinicio administrado del comando de actualización candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto para paquete/actualización/reinicio/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de versión Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una reejecución enfocada
- Ejecuta directamente el workflow manual `CI` cuando solo necesites cobertura completa de CI normal para el candidato de versión. Los lanzamientos manuales de CI omiten el alcance por cambios y fuerzan los shards de Linux Node, shards de plugins incluidos, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, build smoke, comprobaciones de documentación, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de versión. Ejercita QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de span de traza exportados, atributos acotados y redacción de contenido/identificadores sin requerir Opik, Langfuse ni otro colector externo.
- Ejecuta `pnpm release:check` antes de cada versión etiquetada
- Ejecuta `OpenClaw Release Publish` para la secuencia mutante de publicación después de que exista la etiqueta. Lánzalo desde `release/YYYY.M.D` (o `main` al publicar una etiqueta alcanzable desde main), pasa la etiqueta de versión y el `preflight_run_id` exitoso de npm de OpenClaw, y conserva el alcance predeterminado de publicación de plugins `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El workflow serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw para que el paquete core no se publique antes que sus plugins externalizados.
- Las comprobaciones de versión ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad simulada de QA Lab más el perfil rápido live de Matrix y el carril de QA de Telegram antes de aprobar la versión. Los carriles live usan el entorno `qa-live-shared`; Telegram también usa concesiones de credenciales de Convex CI. Ejecuta el workflow manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte, medios y E2EE de Matrix en paralelo.
- La validación de instalación y actualización en tiempo de ejecución entre sistemas operativos forma parte de los workflows públicos `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al workflow reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de versión npm breve, determinista y enfocada en artefactos, mientras que las comprobaciones live más lentas permanecen en su propio carril para que no retrasen ni bloqueen la publicación
- Las comprobaciones de versión que contienen secretos deben lanzarse mediante `Full Release
Validation` o desde la referencia de workflow `main`/release para que la lógica del workflow y los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, una etiqueta o un SHA completo de commit siempre que el commit resuelto sea alcanzable desde una rama o etiqueta de versión de OpenClaw
- La comprobación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo de 40 caracteres del commit actual de la rama del workflow sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de versión real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners alojados en GitHub, mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de Blacksmith
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La comprobación previa de versión npm ya no espera el carril separado de comprobaciones de versión
- Antes de etiquetar localmente un candidato de versión, ejecuta
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. El helper ejecuta las defensas rápidas de versión, las comprobaciones de versión npm/ClawHub de plugins, build, build de UI y `release:openclaw:npm:check` en el orden que detecta errores comunes que bloquean aprobaciones antes de que comience el workflow de publicación de GitHub.
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado en un prefijo temporal limpio
- Después de publicar una beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding de paquete instalado, la configuración de Telegram y Telegram E2E real contra el paquete npm publicado usando el pool compartido de credenciales de Telegram concedidas. Las ejecuciones locales puntuales de maintainers pueden omitir las variables de Convex y pasar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta la validación de actualización npm/fresh-target de Parallels, lanza `NPM Telegram Beta E2E`, sondea la ejecución exacta del workflow, descarga el artefacto e imprime el informe de Telegram.
- Los maintainers pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta en cada merge.
- La automatización de versiones de maintainers ahora usa comprobación previa y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm exitoso
  - la publicación npm real debe lanzarse desde la misma rama `main` o `release/YYYY.M.D` que la ejecución exitosa de comprobación previa
  - las versiones npm estables predeterminan a `beta`
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante input del workflow
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` sigue necesitando `NPM_TOKEN`, mientras que el repositorio público conserva publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una rama de versión pero el workflow se lanza desde `main`, establece `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe pasar `preflight_run_id` y `validate_run_id` privados de mac exitosos
  - las rutas reales de publicación promocionan artefactos preparados en lugar de reconstruirlos de nuevo
- Para versiones estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`, de modo que las correcciones de versión no puedan dejar silenciosamente instalaciones globales antiguas en la carga base estable
- La comprobación previa de versión npm falla de forma cerrada salvo que el tarball incluya tanto `dist/control-ui/index.html` como una carga no vacía de `dist/control-ui/assets/`, para que no volvamos a publicar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los entrypoints de plugins publicados y los metadatos del paquete estén presentes en el layout del registro instalado. Una versión que publica cargas de runtime de plugins ausentes falla el verificador postpublish y no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` de npm pack en el tarball de actualización candidato, de modo que installer e2e detecte crecimiento accidental del paquete antes de la ruta de publicación de versión
- Si el trabajo de versión tocó planificación de CI, manifiestos de temporización de extensiones o matrices de pruebas de extensiones, regenera y revisa las salidas de matriz `plugin-prerelease-extension-shard` propiedad del planificador desde `.github/workflows/plugin-prerelease.yml` antes de aprobar, para que las notas de versión no describan un layout de CI obsoleto
- La preparación de versión estable de macOS también incluye las superficies del actualizador:
  - la versión de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar; el workflow privado de publicación de macOS lo commitea automáticamente o abre un PR de appcast cuando el push directo está bloqueado
  - la app empaquetada debe conservar un bundle id no debug, una URL de feed de Sparkle no vacía y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle para esa versión

## Cajas de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama que avanza rápido, usa el
asistente para que cada workflow hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El asistente publica `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de workflow hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija de `main` más reciente.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de workflow
`main` confiable y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El workflow resuelve la referencia objetivo, despacha `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto padre `release-package-under-test` para comprobaciones orientadas al paquete y
despacha E2E de Telegram de paquete independiente cuando `release_profile=full` con
`rerun_group=all` o cuando `release_package_spec` o
`npm_telegram_package_spec` está definido. Luego `OpenClaw Release
Checks` despliega smoke de instalación, comprobaciones de lanzamiento multiplataforma, cobertura live/E2E de Docker
de ruta de lanzamiento cuando soak está activado, Package Acceptance con QA de paquete de Telegram,
paridad de QA Lab, Matrix live y Telegram live. Una ejecución completa solo es aceptable cuando el
resumen de `Full Release Validation`
muestra `normal_ci` y `release_checks` como correctos. En modo full/all,
el hijo `npm_telegram` también debe ser correcto; fuera de full/all se omite
a menos que se haya proporcionado un `release_package_spec` o `npm_telegram_package_spec`
publicado. El resumen final del
verificador incluye tablas de trabajos más lentos para cada ejecución hija, para que el responsable del lanzamiento
pueda ver la ruta crítica actual sin descargar logs.
Consulta [Validación de lanzamiento completa](/es/reference/full-release-validation) para ver la
matriz de etapas completa, los nombres exactos de trabajos de workflow, las diferencias entre los perfiles
stable y full, los artefactos y los identificadores de repetición enfocados.
Los workflows hijos se despachan desde la referencia confiable que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` objetivo apunta a una
rama o etiqueta de lanzamiento anterior. No hay una entrada de referencia de workflow separada para Full Release Validation;
elige el harness confiable eligiendo la referencia de ejecución del workflow.
No uses `--ref main -f ref=<sha>` para una prueba exacta de commit en `main` móvil;
los SHA de commit sin procesar no pueden ser referencias de despacho de workflow, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: ruta OpenAI/core live y Docker crítica para lanzamiento más rápida
- `stable`: minimum más cobertura estable de proveedor/backend para la aprobación de lanzamiento
- `full`: stable más cobertura amplia consultiva de proveedor/medios

Usa `run_release_soak=true` con `stable` cuando las rutas que bloquean el lanzamiento estén
en verde y quieras el barrido exhaustivo live/E2E, de ruta de lanzamiento Docker y
de supervivencia a actualización publicada acotado antes de la promoción. Ese barrido cubre
los cuatro paquetes stable más recientes, además de las bases fijadas `2026.4.23` y `2026.5.2`
y la cobertura anterior `2026.4.15`, con bases duplicadas eliminadas y
cada base fragmentada en su propio trabajo ejecutor Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa la referencia de workflow confiable para resolver una vez la referencia objetivo
como `release-package-under-test` y reutiliza ese artefacto en comprobaciones multiplataforma,
Package Acceptance y Docker de ruta de lanzamiento cuando se ejecuta soak. Esto mantiene
todas las cajas orientadas al paquete en los mismos bytes y evita compilaciones de paquete repetidas.
Después de que una beta ya esté en npm, define `release_package_spec=openclaw@YYYY.M.D-beta.N`
para que las comprobaciones de lanzamiento descarguen una vez el paquete publicado, extraigan su SHA de origen
de compilación desde `dist/build-info.json` y reutilicen ese artefacto para rutas multiplataforma,
Package Acceptance, Docker de ruta de lanzamiento y Telegram de paquete.
El smoke de instalación OpenAI multiplataforma usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/org está definida; de lo contrario, `openai/gpt-5.4`, porque esta ruta está
probando la instalación del paquete, la incorporación, el arranque del Gateway y un turno de agente live,
en lugar de hacer benchmark del modelo predeterminado más lento. La matriz live de proveedores más amplia
sigue siendo el lugar para la cobertura específica por modelo.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No uses el paraguas completo como la primera repetición después de una corrección enfocada. Si falla una caja,
usa el workflow hijo, el trabajo, la ruta Docker, el perfil de paquete, el proveedor
de modelo o la ruta de QA que falló para la siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando
la corrección haya cambiado la orquestación de lanzamiento compartida o haya vuelto obsoleta la evidencia anterior
de todas las cajas. El verificador final del paraguas vuelve a comprobar los ids de ejecución de workflows hijos
registrados, así que después de que un workflow hijo se repita correctamente, repite solo el trabajo padre
`Verify full validation` que falló.

Para una recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
del candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease`
ejecuta solo el hijo de Plugin exclusivo de lanzamiento, `release-checks` ejecuta todas las cajas
de lanzamiento, y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las repeticiones enfocadas de `npm-telegram` requieren `release_package_spec` o
`npm_telegram_package_spec`; las ejecuciones full/all con `release_profile=full` usan el
artefacto de paquete de release-checks. Las repeticiones enfocadas
multiplataforma pueden agregar `cross_os_suite_filter=windows/packaged-upgrade` u
otro filtro de SO/suite. Los fallos de QA en release-check son consultivos; un fallo solo de QA
no bloquea la validación del lanzamiento.

### Vitest

La caja Vitest es el workflow hijo `CI` manual. La CI manual evita intencionadamente
el ámbito por cambios y fuerza el grafo de pruebas normal para el candidato
de lanzamiento: fragmentos Linux Node, fragmentos de Plugin incluido, contratos de canal, compatibilidad con Node 22,
`check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python,
Windows, macOS, Android e i18n de Control UI.

Usa esta caja para responder "¿pasó el árbol de código fuente la suite completa normal de pruebas?"
No es lo mismo que la validación de producto de ruta de lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de ejecución `CI` despachada
- ejecución `CI` en verde en el SHA objetivo exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesita CI normal determinista pero
no las cajas Docker, QA Lab, live, multiplataforma o de paquete:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La caja Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del workflow
`install-smoke` en modo lanzamiento. Valida el candidato de lanzamiento mediante entornos Docker
empaquetados en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de lanzamiento incluye:

- smoke de instalación completo con el smoke de instalación global Bun lento activado
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA objetivo, con trabajos de smoke de QR,
  raíz/Gateway e instalador/Bun ejecutándose como fragmentos install-smoke separados
- rutas E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- rutas divididas de instalación/desinstalación de Plugin incluido
  `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suites de proveedores live/E2E y cobertura de modelos live Docker cuando las comprobaciones de lanzamiento
  incluyen suites live

Usa artefactos Docker antes de repetir. El planificador de ruta de lanzamiento carga
`.artifacts/docker-tests/` con logs de rutas, `summary.json`, `failures.json`,
tiempos de fases, JSON del plan del planificador y comandos de repetición. Para una recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el workflow reutilizable live/E2E en lugar de
repetir todos los fragmentos de lanzamiento. Los comandos de repetición generados incluyen el
`package_artifact_run_id` anterior y entradas de imagen Docker preparada cuando están disponibles, para que una
ruta fallida pueda reutilizar el mismo tarball e imágenes GHCR.

### QA Lab

La caja QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento
de comportamiento agéntico y nivel de canal, separada de Vitest y de la mecánica
de paquetes Docker.

La cobertura QA Lab de lanzamiento incluye:

- ruta de paridad mock que compara la ruta candidata de OpenAI con la base Opus 4.6
  usando el paquete de paridad agéntica
- perfil QA de Matrix live rápido usando el entorno `qa-live-shared`
- ruta QA de Telegram live usando leases de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta caja para responder "¿se comporta correctamente el lanzamiento en escenarios de QA y
flujos de canales live?" Conserva las URL de artefactos para las rutas de paridad, Matrix y Telegram
al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una
ejecución manual fragmentada de QA-Lab en lugar de la ruta predeterminada crítica para el lanzamiento.

### Paquete

La caja Package es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y SHA-256, y mantiene la
referencia del harness de workflow separada de la referencia de origen del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo de `package_ref` confiable
  con el harness `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutilizar un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto preparado del paquete de lanzamiento, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la actualización,
el reinicio de actualización con autenticación configurada, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de plugins, los
fixtures de plugins sin conexión, la actualización de plugins y la QA del paquete de Telegram contra el mismo
tarball resuelto. Las comprobaciones de lanzamiento bloqueantes usan la línea base predeterminada del paquete publicado más reciente;
`run_release_soak=true` o
`release_profile=full` se expande a cada línea base estable publicada en npm desde
`2026.4.23` hasta `latest`, además de los fixtures de problemas reportados. Usa
Package Acceptance con `source=npm` para un candidato ya publicado, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes de
publicar. Es el reemplazo nativo de GitHub
para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería
Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen importando para el onboarding,
el instalador y el comportamiento de plataforma específicos del sistema operativo, pero la validación de producto de paquetes/actualizaciones debe
preferir Package Acceptance.

La lista de comprobación canónica para la validación de actualizaciones y plugins es
[Probar actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué carril local, Docker, Package Acceptance o de comprobación de lanzamiento demuestra un
cambio en la instalación/actualización de un plugin, la limpieza de doctor o la migración de un paquete publicado.
La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es
un flujo de trabajo manual separado de `Update Migration`, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está delimitada en el tiempo intencionalmente. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas
en npm: entradas privadas del inventario de QA ausentes del tarball, falta de
`gateway install --wrapper`, falta de archivos de parche en el fixture de git derivado del tarball,
falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins,
falta de persistencia del registro de instalación del marketplace y migración de metadatos de configuración
durante `plugins update`. El paquete publicado `2026.4.26` puede advertir
por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores
deben cumplir los contratos de paquete modernos; esas mismas brechas fallan la
validación de lanzamiento.

Usa perfiles de Package Acceptance más amplios cuando la pregunta de lanzamiento sea sobre un
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

- `smoke`: carriles rápidos de instalación/canal/agente de paquete, red de Gateway y recarga de
  configuración
- `package`: contratos de paquete de instalación/actualización/reinicio/plugin, además de prueba de instalación en vivo de Skills de ClawHub; este es el valor predeterminado de comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para pruebas de Telegram de candidatos de paquete, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el
tarball resuelto de `package-under-test` al carril de Telegram; el flujo de trabajo independiente de
Telegram sigue aceptando una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamiento

`OpenClaw Release Publish` es el punto de entrada normal de publicación con mutaciones. Este
orquesta los flujos de trabajo de publicador de confianza en el orden que necesita el lanzamiento:

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

Publicación estable en la dist-tag beta predeterminada:

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
`OpenClaw Release Publish`, o despacha directamente el flujo de trabajo hijo cuando el
paquete de OpenClaw no deba publicarse.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo de 40 caracteres de la rama del flujo de trabajo actual para un preflight solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución de preflight exitosa
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida; ya debe existir
- `preflight_run_id`: id de ejecución de preflight exitosa de `OpenClaw NPM Release`;
  requerido cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta npm de destino para el paquete de OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo cuando uses el
  flujo de trabajo como orquestador de reparación solo de plugins
- `wait_for_clawhub`: el valor predeterminado es `false` para que la disponibilidad de npm no quede bloqueada por
  el sidecar de ClawHub; establece `true` solo cuando la finalización del flujo de trabajo deba incluir
  la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones con secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  etiqueta de lanzamiento.
- `run_release_soak`: optar por la prueba exhaustiva live/E2E, la ruta de lanzamiento de Docker y
  la prueba soak de upgrade-survivor desde todos los paquetes en comprobaciones de lanzamiento estables/predeterminadas. Se fuerza
  mediante `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas beta prerelease solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante el preflight;
  el flujo de trabajo verifica esos metadatos antes de que continúe la publicación

## Secuencia de lanzamiento npm estable

Al preparar un lanzamiento npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo de la rama del flujo de trabajo actual
     para una ejecución de prueba solo de validación del flujo de trabajo de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de commit completo
   cuando quieras CI normal más cobertura de live prompt cache, Docker, QA Lab,
   Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la ref de lanzamiento en su lugar
5. Guarda el `preflight_run_id` exitoso
6. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el lanzamiento aterrizó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autorreparación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene una publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación npm local, ejecuta cualquier comando de la CLI de 1Password
(`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
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
