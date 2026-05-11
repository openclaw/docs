---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de lanzamiento o la aceptación de paquetes
    - Buscando la nomenclatura de versiones y la cadencia
summary: Canales de lanzamiento, lista de verificación del operador, cuadros de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-11T20:51:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres carriles de lanzamiento públicos:

- stable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas preliminares que se publican en npm `beta`
- dev: la punta móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión preliminar beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No agregues ceros a la izquierda en el mes ni en el día
- `latest` significa el lanzamiento estable actual de npm promovido
- `beta` significa el destino actual de instalación beta
- Los lanzamientos estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más tarde una compilación beta revisada
- Cada lanzamiento estable de OpenClaw distribuye el paquete npm y la app de macOS juntos;
  los lanzamientos beta normalmente validan y publican primero la ruta de npm/paquete, con
  la compilación/firma/notarización de la app para Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamiento

- Los lanzamientos avanzan primero por beta
- Estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente preparan lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir de `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores preparan
  la siguiente etiqueta `-beta.N` en lugar de borrar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el manual operativo de lanzamiento solo para mantenedores.

1. Empieza desde `main` actual: trae los últimos cambios, confirma que el commit de destino se ha enviado,
   y confirma que el CI actual de `main` está lo suficientemente verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` desde el historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la
   compatibilidad vencida solo cuando la ruta de actualización siga cubierta, o registra por qué se
   mantiene intencionalmente.
4. Crea `release/YYYY.M.D` desde `main` actual; no hagas trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista y luego ejecuta
   `pnpm release:prep`. Actualiza versiones de plugins, inventario de plugins, esquema de
   configuración, metadatos de configuración de canales incluidos, línea base de documentación de configuración,
   exportaciones del SDK de plugins y línea base de API del SDK de plugins en el orden correcto. Haz commit de cualquier
   diferencia generada antes de etiquetar. Luego ejecuta la verificación previa local determinista:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento para la verificación previa
   solo de validación. Guarda el `preflight_run_id` correcto.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA completo del commit. Este es el único punto de entrada manual
   para los cuatro grandes entornos de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo,
   carril, trabajo de workflow, perfil de paquete, proveedor o allowlist de modelos más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie modificada vuelva
   obsoleta la evidencia previa.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   despacha todos los paquetes de plugins publicables a npm y el mismo conjunto a
   ClawHub en paralelo, y luego promueve el artefacto de verificación previa de npm de OpenClaw preparado
   con el dist-tag correspondiente en cuanto la publicación de plugins en npm tenga éxito.
   Después de que el proceso hijo de publicación de npm de OpenClaw tenga éxito, crea o actualiza la
   página de lanzamiento/prelanzamiento de GitHub correspondiente desde la sección completa correspondiente de
   `CHANGELOG.md`. Los lanzamientos estables publicados en npm `latest` se convierten en el
   último lanzamiento de GitHub; los lanzamientos estables de mantenimiento mantenidos en npm `beta` se
   crean con GitHub `latest=false`.
   La publicación en ClawHub puede seguir ejecutándose mientras OpenClaw npm se publica, pero el
   workflow de publicación de lanzamiento imprime los ID de ejecución hijos de inmediato. De forma predeterminada,
   no espera a ClawHub después de despacharlo, por lo que la disponibilidad de OpenClaw npm
   no queda bloqueada por aprobaciones o trabajo de registro más lentos de ClawHub; establece
   `wait_for_clawhub=true` cuando ClawHub deba bloquear la finalización del workflow. La
   ruta de ClawHub reintenta fallos transitorios de instalación de dependencias de CLI, publica
   plugins que pasan la vista previa incluso cuando una celda de vista previa falla de forma intermitente, y termina con
   verificación del registro para cada versión de plugin esperada para que las publicaciones parciales
   sigan siendo visibles y reintentables. Después de publicar, ejecuta
   la aceptación de paquetes posterior a la publicación
   contra el paquete `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta` publicado. Si un prelanzamiento enviado o publicado necesita una corrección,
   prepara el siguiente número de prelanzamiento correspondiente; no borres ni reescribas el prelanzamiento
   anterior.
10. Para estable, continúa solo después de que la beta o candidata de lanzamiento revisada tenga la
    evidencia de validación requerida. La publicación estable de npm también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de verificación previa correcto mediante
    `preflight_run_id`; la preparación del lanzamiento estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
    El workflow privado de publicación de macOS publica automáticamente el appcast firmado en el
    `main` público después de verificar los recursos de lanzamiento; si la protección de rama bloquea
    el push directo, abre o actualiza un PR de appcast.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E independiente opcional de Telegram
    desde npm publicado cuando necesites prueba del canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, verifica la página de lanzamiento de GitHub generada,
    y ejecuta los pasos de anuncio de lanzamiento.

## Verificación previa de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación preliminar de la versión para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación preliminar de la versión para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de versión esperados
  `dist/*` y el paquete de Control UI existan para el paso de validación
  del empaquetado
- Ejecuta `pnpm release:prep` después del aumento de versión raíz y antes de etiquetar. Ejecuta
  todos los generadores de versión deterministas que suelen desviarse tras un cambio de
  versión/configuración/API: versiones de plugins, inventario de plugins, esquema de configuración
  base, metadatos de configuración de canales incluidos, línea base de documentación de configuración, exportaciones del SDK de plugins
  y línea base de API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas
  protecciones en modo de comprobación e informa en una sola
  pasada de cada fallo de desviación generada que encuentra antes de ejecutar las comprobaciones de versión del paquete.
- Ejecuta el flujo de trabajo manual `Full Release Validation` antes de la aprobación de la versión para
  iniciar todas las cajas de prueba previas a la versión desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA de commit completo, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para smoke de instalación, aceptación de paquete, comprobaciones de paquete
  entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas
  mantienen el E2E/en vivo exhaustivo y la prueba prolongada de ruta de versión de Docker detrás de
  `run_release_soak=true`; `release_profile=full` fuerza la prueba prolongada. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta el E2E de Telegram de paquete
  contra el artefacto `release-package-under-test` de las comprobaciones de versión.
  Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete npm
  enviado en las comprobaciones de versión, Package Acceptance y E2E de Telegram de paquete sin
  reconstruir el tarball de versión. Proporciona
  `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado
  distinto del resto de la validación de versión. Proporciona
  `package_acceptance_package_spec` cuando Package Acceptance deba usar un
  paquete publicado distinto de la especificación del paquete de versión. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba demostrar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo de trabajo manual `Package Acceptance` cuando quieras una prueba de canal lateral
  para un candidato de paquete mientras continúa el trabajo de versión. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un SHA-256
  requerido; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El flujo de trabajo resuelve el candidato a
  `package-under-test`, reutiliza el planificador de versión Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto
  de paquete es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada. `update-restart-auth` usa el paquete candidato como
  CLI instalado y como package-under-test para que ejercite la ruta de reinicio
  administrado del comando de actualización candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto de paquete/actualización/reinicio/plugin sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de versión Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta directamente el flujo de trabajo manual `CI` cuando solo necesites cobertura completa
  de CI normal para el candidato de versión. Los despachos manuales de CI omiten el alcance
  por cambios y fuerzan los shards Linux Node, shards de plugins incluidos, contratos de canales,
  compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación,
  comprobaciones de documentación, Skills de Python, Windows, macOS, Android y carriles i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de versión. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans
  de trazas exportados, atributos acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro recopilador externo.
- Ejecuta `pnpm release:check` antes de cada versión etiquetada
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que exista la
  etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de versión y el
  `preflight_run_id` exitoso de OpenClaw npm, y mantén el alcance predeterminado de publicación de plugins
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El
  flujo de trabajo serializa la publicación npm de plugins, la publicación ClawHub de plugins y la publicación npm de OpenClaw
  para que el paquete principal no se publique antes que sus plugins
  externalizados.
- Las comprobaciones de versión ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil
  Matrix en vivo rápido y el carril QA de Telegram antes de la aprobación de versión. Los carriles en vivo
  usan el entorno `qa-live-shared`; Telegram también usa préstamos de credenciales de Convex CI.
  Ejecuta el flujo de trabajo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de
  transporte, medios y E2EE de Matrix en paralelo.
- La validación en tiempo de ejecución de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  flujo de trabajo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantener la ruta real de versión npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones en vivo más lentas permanecen en su
  propio carril para no retrasar ni bloquear la publicación
- Las comprobaciones de versión con secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de flujo de trabajo `main`/release para que la lógica del flujo de trabajo y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA de commit completo siempre que
  el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de versión
- La verificación preliminar solo de validación de `OpenClaw NPM Release` también acepta el SHA de commit completo
  actual de 40 caracteres de la rama del flujo de trabajo sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos de paquete; la publicación real sigue requiriendo una etiqueta de versión real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners alojados en GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de
  Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación preliminar de versión npm ya no espera el carril separado de comprobaciones de versión
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación
  del registro publicado en un prefijo temporal limpio
- Después de publicar una beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales prestadas de Telegram.
  Las ejecuciones locales puntuales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El ayudante ejecuta la validación de actualización npm/objetivo limpio de Parallels, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de versiones para mantenedores ahora usa verificación preliminar y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución de verificación preliminar exitosa
  - las versiones npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante entrada del flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el
    repositorio público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una
    rama de versión pero el flujo de trabajo se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación real privada de Mac debe pasar `preflight_run_id` y
    `validate_run_id` privados de Mac exitosos
  - las rutas de publicación real promocionan artefactos preparados en lugar de reconstruirlos
    otra vez
- Para versiones estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de versión no puedan dejar silenciosamente instalaciones globales antiguas en la
  carga base estable
- La verificación preliminar de versión npm falla cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía de `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y
  los metadatos de paquete estén presentes en el diseño del registro instalado. Una versión que
  envíe cargas de runtime de plugins faltantes falla el verificador posterior a la publicación y
  no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` de npm pack en
  el tarball de actualización candidato, por lo que el e2e de instalador detecta el aumento accidental del paquete
  antes de la ruta de publicación de versión
- Si el trabajo de versión tocó planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de versión no
  describan un diseño de CI obsoleto
- La preparación de una versión estable de macOS también incluye las superficies del actualizador:
  - la versión de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación; el
    flujo de trabajo privado de publicación de macOS lo confirma automáticamente, o abre un PR de appcast
    cuando el push directo está bloqueado
  - la app empaquetada debe conservar un identificador de bundle no debug, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Cajas de prueba de versión

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas a la versión desde
un único punto de entrada. Para una prueba de commit fijado en una rama que se mueve rápido, usa el
ayudante para que cada flujo de trabajo hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El asistente envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada flujo de trabajo hijo
`headSha` coincida con el objetivo y luego elimina la rama temporal. Esto evita
probar por accidente una ejecución hija de `main` más reciente.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la ref de flujo
de trabajo confiable `main` y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El flujo de trabajo resuelve la ref objetivo, despacha `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto padre `release-package-under-test` para las comprobaciones orientadas
a paquetes y despacha el E2E independiente de Telegram del paquete cuando
`release_profile=full` con `rerun_group=all` o cuando `release_package_spec` o
`npm_telegram_package_spec` está establecido. Luego `OpenClaw Release
Checks` despliega en paralelo las comprobaciones de humo de instalación, las
comprobaciones de lanzamiento entre sistemas operativos, la cobertura live/E2E
Docker de la ruta de lanzamiento cuando soak está habilitado, Package Acceptance
con QA de paquete de Telegram, paridad de QA Lab, Matrix en vivo y Telegram en
vivo. Una ejecución completa solo es aceptable cuando el resumen de
`Full Release Validation`
muestra `normal_ci` y `release_checks` como correctos. En modo full/all, el hijo
`npm_telegram` también debe ser correcto; fuera de full/all se omite salvo que
se haya proporcionado un `release_package_spec` o `npm_telegram_package_spec`
publicado. El resumen final del verificador incluye tablas de trabajos más
lentos para cada ejecución hija, de modo que el responsable de lanzamiento pueda
ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la
matriz completa de etapas, los nombres exactos de los trabajos del flujo de
trabajo, las diferencias entre los perfiles stable y full, los artefactos y los
identificadores de reejecución enfocados.
Los flujos de trabajo hijos se despachan desde la ref confiable que ejecuta
`Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref`
objetivo apunta a una rama o etiqueta de lanzamiento anterior. No hay una
entrada separada de ref de flujo de trabajo para Full Release Validation; elige
el arnés confiable eligiendo la ref de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para prueba de commit exacto en un `main` en
movimiento; los SHA de commit sin procesar no pueden ser refs de despacho de
flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: la ruta live y Docker de OpenAI/núcleo crítica para lanzamiento más rápida
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de lanzamiento
- `full`: stable más cobertura amplia de proveedores/medios de aviso

Usa `run_release_soak=true` con `stable` cuando los carriles bloqueantes de
lanzamiento estén verdes y quieras el barrido exhaustivo live/E2E, la ruta de
lanzamiento Docker y el barrido acotado de supervivencia a actualizaciones
publicadas antes de la promoción. Ese barrido cubre los cuatro paquetes stable
más recientes, más las líneas base fijadas `2026.4.23` y `2026.5.2`, además de
cobertura anterior de `2026.4.15`, con líneas base duplicadas eliminadas y cada
línea base dividida en su propio trabajo de ejecutor Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa la ref de flujo de trabajo confiable para resolver
la ref objetivo una vez como `release-package-under-test` y reutiliza ese
artefacto en las comprobaciones entre sistemas operativos, Package Acceptance y
Docker de ruta de lanzamiento cuando se ejecuta soak. Esto mantiene todos los
entornos orientados a paquetes en los mismos bytes y evita compilaciones de
paquete repetidas.
Después de que una beta ya esté en npm, establece `release_package_spec=openclaw@YYYY.M.D-beta.N`
para que las comprobaciones de lanzamiento descarguen una vez el paquete enviado,
extraigan su SHA de origen de compilación desde `dist/build-info.json` y
reutilicen ese artefacto para los carriles entre sistemas operativos,
Package Acceptance, Docker de ruta de lanzamiento y Telegram de paquete.
La comprobación de humo de instalación de OpenAI entre sistemas operativos usa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la variable de repositorio/organización
está establecida; de lo contrario, usa `openai/gpt-5.4`, porque este carril
prueba la instalación del paquete, el onboarding, el arranque del Gateway y un
turno de agente en vivo, no el rendimiento del modelo predeterminado más lento.
La matriz live de proveedores más amplia sigue siendo el lugar para la cobertura
específica por modelo.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No uses el paraguas completo como la primera reejecución después de una corrección
enfocada. Si falla un entorno, usa el flujo de trabajo hijo, trabajo, carril
Docker, perfil de paquete, proveedor de modelo o carril de QA fallido para la
siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando la corrección
haya cambiado la orquestación compartida de lanzamiento o haya vuelto obsoleta la
evidencia anterior de todos los entornos. El verificador final del paraguas vuelve
a comprobar los id. de ejecución de flujos de trabajo hijos registrados, así que
después de que un flujo de trabajo hijo se reejecute correctamente, reejecuta solo
el trabajo padre `Verify full validation` fallido.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución
real del candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal,
`plugin-prerelease` ejecuta solo el hijo de plugins exclusivo de lanzamiento,
`release-checks` ejecuta todos los entornos de lanzamiento, y los grupos de
lanzamiento más estrechos son `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las reejecuciones enfocadas de `npm-telegram` requieren `release_package_spec` o
`npm_telegram_package_spec`; las ejecuciones full/all con `release_profile=full`
usan el artefacto de paquete de release-checks. Las reejecuciones enfocadas entre
sistemas operativos pueden agregar `cross_os_suite_filter=windows/packaged-upgrade`
u otro filtro de sistema operativo/suite. Los fallos de QA en release-checks son
consultivos; un fallo solo de QA no bloquea la validación de lanzamiento.

### Vitest

El entorno de Vitest es el flujo de trabajo hijo `CI` manual. CI manual omite
intencionalmente el alcance por cambios y fuerza el grafo de pruebas normal para
el candidato de lanzamiento: shards de Linux Node, shards de plugins agrupados,
contratos de canales, compatibilidad con Node 22, `check`, `check-additional`,
humo de compilación, comprobaciones de documentación, Skills de Python, Windows,
macOS, Android e i18n de Control UI.

Usa este entorno para responder "¿el árbol de código fuente pasó la suite completa
normal de pruebas?" No es lo mismo que la validación de producto de ruta de
lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` verde en el SHA objetivo exacto
- nombres de shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesite análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesite CI normal
determinista, pero no los entornos Docker, QA Lab, live, entre sistemas
operativos ni de paquete:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

El entorno Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo
`install-smoke` en modo de lanzamiento. Valida el candidato de lanzamiento
mediante entornos Docker empaquetados en vez de solo pruebas a nivel de código
fuente.

La cobertura Docker de lanzamiento incluye:

- humo de instalación completo con el humo de instalación global lenta de Bun habilitado
- preparación/reutilización de imagen de humo del Dockerfile raíz por SHA objetivo, con trabajos de humo de QR,
  raíz/Gateway e instalador/Bun ejecutándose como shards separados de install-smoke
- carriles E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicite
- carriles separados de instalación/desinstalación de plugins agrupados
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites de proveedores live/E2E y cobertura de modelos live Docker cuando las comprobaciones de lanzamiento
  incluyen suites live

Usa los artefactos Docker antes de reejecutar. El programador de ruta de
lanzamiento carga `.artifacts/docker-tests/` con registros de carriles,
`summary.json`, `failures.json`, tiempos de fases, JSON de plan del programador y
comandos de reejecución. Para recuperación enfocada, usa
`docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en vez
de reejecutar todos los fragmentos de lanzamiento. Los comandos de reejecución
generados incluyen `package_artifact_run_id` anterior y entradas de imágenes
Docker preparadas cuando están disponibles, de modo que un carril fallido pueda
reutilizar el mismo tarball y las mismas imágenes GHCR.

### QA Lab

El entorno QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta
de lanzamiento de comportamiento agéntico y a nivel de canal, separada de Vitest
y de la mecánica de paquetes Docker.

La cobertura de QA Lab de lanzamiento incluye:

- carril de paridad mock que compara el carril candidato de OpenAI contra la línea base Opus 4.6
  usando el paquete de paridad agéntica
- perfil rápido de QA de Matrix en vivo usando el entorno `qa-live-shared`
- carril de QA de Telegram en vivo usando alquileres de credenciales de CI de Convex
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa este entorno para responder "¿el lanzamiento se comporta correctamente en
escenarios de QA y flujos de canales en vivo?" Conserva las URL de artefactos de
los carriles de paridad, Matrix y Telegram al aprobar el lanzamiento. La cobertura
completa de Matrix sigue estando disponible como una ejecución manual fragmentada
de QA-Lab, no como el carril predeterminado crítico para lanzamiento.

### Paquete

El entorno Package es la puerta de producto instalable. Está respaldado por
`Package Acceptance` y el resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida el
inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene
la ref del arnés de flujo de trabajo separada de la ref de origen del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo confiable de `package_ref`
  con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutilizar un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto preparado del paquete de lanzamiento, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la
actualización, el reinicio de actualización con autenticación configurada, la
instalación de Skills live de ClawHub, la limpieza de dependencias obsoletas de
plugins, fixtures de plugins sin conexión, actualización de plugins y QA de
paquete de Telegram contra el mismo tarball resuelto. Las comprobaciones
bloqueantes de lanzamiento usan la línea base predeterminada del paquete
publicado más reciente; `run_release_soak=true` o
`release_profile=full` se expande a todas las líneas base stable publicadas en
npm desde `2026.4.23` hasta `latest`, más fixtures de problemas reportados. Usa
Package Acceptance con `source=npm` para un candidato ya enviado, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes
de publicar. Es el reemplazo nativo de GitHub para la mayor parte de la cobertura
de paquete/actualización que antes requería Parallels. Las comprobaciones de
lanzamiento entre sistemas operativos siguen importando para onboarding,
instalador y comportamiento de plataforma específicos del sistema operativo, pero
la validación de producto de paquete/actualización debería preferir Package
Acceptance.

La lista de comprobación canónica para validar actualizaciones y plugins es
[Probar actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué carril local, Docker, Package Acceptance o de comprobación de
lanzamiento demuestra un cambio de instalación/actualización de plugin,
limpieza de doctor o migración de paquete publicado. La migración exhaustiva de
actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo
de trabajo manual `Update Migration` independiente, no parte de Full Release CI.

La flexibilidad heredada de package-acceptance está limitada intencionalmente en
el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad
para brechas de metadatos ya publicadas en npm: entradas privadas de inventario
de QA faltantes en el tarball, `gateway install --wrapper` faltante, archivos de
parche faltantes en el fixture de git derivado del tarball, `update.channel`
persistido faltante, ubicaciones heredadas de registros de instalación de
plugins, persistencia faltante de registros de instalación del marketplace y
migración de metadatos de configuración durante `plugins update`. El paquete
publicado `2026.4.26` puede advertir sobre archivos locales de sello de
metadatos de compilación que ya se enviaron. Los paquetes posteriores deben
satisfacer los contratos de paquetes modernos; esas mismas brechas fallan la
validación de lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de lanzamiento
trate sobre un paquete instalable real:

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

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red de
  Gateway y recarga de configuración
- `package`: contratos de paquete de instalación/actualización/reinicio/plugin
  más prueba de instalación de skill de ClawHub en vivo; este es el valor
  predeterminado de comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web
  de OpenAI y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram de candidato de paquete, habilita
`telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package
Acceptance. El flujo de trabajo pasa el tarball resuelto
`package-under-test` al carril de Telegram; el flujo de trabajo independiente de
Telegram todavía acepta una especificación npm publicada para comprobaciones
posteriores a la publicación.

## Automatización de publicación de lanzamientos

`OpenClaw Release Publish` es el punto de entrada normal de publicación con
mutaciones. Orquesta los flujos de trabajo de trusted-publisher en el orden que
necesita el lanzamiento:

1. Extraer la etiqueta de lanzamiento y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de lanzamiento, el dist-tag
   de npm y el `preflight_run_id` guardado.

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

Usa los flujos de trabajo de menor nivel `Plugin NPM Release` y
`Plugin ClawHub Release` solo para trabajos enfocados de reparación o
republicación. Para una reparación de plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha el flujo de trabajo hijo directamente
cuando el paquete de OpenClaw no debe publicarse.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de
  commit completo actual de 40 caracteres de la rama del flujo de trabajo para
  una prevalidación solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false`
  para la ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el
  flujo de trabajo reutilice el tarball preparado de la ejecución de preflight
  exitosa
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; el valor
  predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución de preflight exitoso de
  `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta npm de destino para el paquete OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa
  `selected` solo para trabajos enfocados de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false`
  solo cuando uses el flujo de trabajo como orquestador de reparación solo de
  plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo que validar. Las comprobaciones
  con secretos requieren que el commit resuelto sea alcanzable desde una rama de
  OpenClaw o una etiqueta de lanzamiento.
- `run_release_soak`: optar por la prueba exhaustiva en vivo/E2E, la ruta de
  lanzamiento de Docker y la prueba de resistencia all-since upgrade-survivor en
  comprobaciones de lanzamiento estables/predeterminadas. Se fuerza con
  `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, se permite la entrada de SHA de commit completo
  solo cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son solo de
  validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante
  preflight; el flujo de trabajo verifica esos metadatos antes de que continúe
  la publicación

## Secuencia de lanzamiento estable de npm

Al preparar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo
     actual de la rama del flujo de trabajo para un ensayo seco solo de
     validación del flujo de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de
   lanzamiento o el SHA de commit completo cuando quieras CI normal más cobertura
   de caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram desde un único
   flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista,
   ejecuta el flujo de trabajo manual `CI` en la ref de lanzamiento en su lugar
5. Guarda el `preflight_run_id` exitoso
6. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo
   `npm_dist_tag` y el `preflight_run_id` guardado; publica los plugins
   externalizados en npm y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionalmente directamente en `latest` y
   `beta` debe seguir de inmediato la misma compilación estable, usa ese mismo
   flujo de trabajo privado para apuntar ambos dist-tags a la versión estable, o
   deja que su sincronización programada de autorreparación mueva `beta` más
   tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque
todavía requiere `NPM_TOKEN`, mientras que el repositorio público mantiene una
publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de
publicación directa como la ruta de promoción beta primero.

Si un mantenedor debe recurrir a autenticación local de npm, ejecuta cualquier
comando de la CLI de 1Password (`op`) solo dentro de una sesión tmux dedicada. No
llames a `op` directamente desde la shell principal del agente; mantenerlo dentro
de tmux hace observables los prompts, alertas y manejo de OTP, y evita alertas
repetidas del host.

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
