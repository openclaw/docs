---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de lanzamiento o de la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-07T13:24:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales públicos de lanzamiento:

- estable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- desarrollo: la punta móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa el lanzamiento estable actual de npm promocionado
- `beta` significa el objetivo actual de instalación beta
- Los lanzamientos estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar a `latest` explícitamente, o promocionar más tarde una compilación beta verificada
- Cada lanzamiento estable de OpenClaw distribuye el paquete npm y la app para macOS juntos;
  los lanzamientos beta normalmente validan y publican primero la ruta de npm/paquete, con
  la compilación/firma/notarización de la app de Mac reservada para estable, salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente cortan lanzamientos desde una rama `release/YYYY.M.D` creada
  desde el `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores cortan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el manual de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo más reciente, confirma que el commit objetivo se haya enviado,
   y confirma que el CI actual de `main` esté lo suficientemente verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` desde el historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo, y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la compatibilidad caducada
   solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva
   intencionalmente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas el trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes de Plugin publicables compartan la versión de lanzamiento
   y los metadatos de compatibilidad, luego ejecuta la comprobación previa determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento para una comprobación previa
   solo de validación. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, la etiqueta o el SHA completo del commit. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, canal,
   job de workflow, perfil de paquete, proveedor o allowlist de modelos fallido más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada deje
   obsoleta la evidencia anterior.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   despacha todos los paquetes de Plugin publicables a npm y el mismo conjunto a
   ClawHub en paralelo, y luego promociona el artefacto de comprobación previa npm de OpenClaw preparado
   con el dist-tag correspondiente tan pronto como la publicación npm de Plugin tenga éxito.
   La publicación en ClawHub aún puede seguir ejecutándose mientras se publica el npm de OpenClaw, pero el
   workflow de publicación de lanzamiento no termina hasta que ambas rutas de publicación de Plugin y
   la ruta de publicación npm de OpenClaw se hayan completado correctamente. Después de publicar, ejecuta
   la aceptación de paquete posterior a la publicación
   contra el paquete `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta` publicado. Si un prelanzamiento enviado o publicado necesita una corrección,
   corta el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el
   prelanzamiento anterior.
10. Para estable, continúa solo después de que la beta verificada o la candidata de lanzamiento tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de comprobación previa exitoso mediante
    `preflight_run_id`; la preparación del lanzamiento estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador npm posterior a la publicación, el E2E de Telegram opcional
    publicado en npm independiente cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, las notas de lanzamiento/prelanzamiento de GitHub desde la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Comprobación previa de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la comprobación preliminar de lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida de `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la comprobación preliminar de lanzamiento para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados
  `dist/*` y el paquete de Control UI existan para el paso de validación
  del empaquetado
- Ejecuta `pnpm plugins:sync` después del aumento de versión raíz y antes de etiquetar. Actualiza las versiones publicables de paquetes de plugins, los metadatos de compatibilidad
  de pares/API de OpenClaw, los metadatos de compilación y los stubs de changelog de plugins para que coincidan con la versión de lanzamiento
  principal. `pnpm plugins:sync:check` es el guardián de lanzamiento no mutante;
  el flujo de publicación falla antes de cualquier mutación del registro si este paso se
  olvidó.
- Ejecuta el flujo manual `Full Release Validation` antes de aprobar el lanzamiento para
  iniciar todas las cajas de prueba previas al lanzamiento desde un solo punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para smoke de instalación, aceptación de paquete, comprobaciones de paquete entre SO,
  paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas
  mantienen el soak exhaustivo live/E2E y de ruta de lanzamiento Docker detrás de
  `run_release_soak=true`; `release_profile=full` fuerza el soak. Con
  `release_profile=full` y `rerun_group=all`, también ejecuta el E2E de Telegram de paquete
  contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento.
  Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo E2E de Telegram
  también deba probar el paquete npm publicado. Proporciona
  `package_acceptance_package_spec` después de publicar cuando Package Acceptance
  deba ejecutar su matriz de paquete/actualización contra el paquete npm enviado en lugar
  del artefacto construido desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba probar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo manual `Package Acceptance` cuando quieras evidencia de canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés actual
  `workflow_ref`; `source=url` para un tarball HTTPS con un
  SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El flujo resuelve el candidato a
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de
  paquete es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada. `update-restart-auth` usa el paquete candidato como
  CLI instalada y como paquete en prueba para que ejercite la ruta de reinicio
  gestionado del comando de actualización candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de gateway y recarga de configuración
  - `package`: carriles nativos de artefacto de paquete/actualización/reinicio/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta directamente el flujo manual `CI` cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el acotado por cambios
  y fuerzan los shards de Linux Node, shards de plugins incluidos, contratos de canal,
  compatibilidad con Node 22, `check`, `check-additional`, smoke de build,
  comprobaciones de docs, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor local OTLP/HTTP y verifica los nombres de spans de traza
  exportados, atributos acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse ni otro colector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que
  exista la etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento y el
  `preflight_run_id` exitoso de npm de OpenClaw, y mantén el alcance predeterminado de publicación de plugins
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El
  flujo serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw
  para que el paquete principal no se publique antes que sus plugins
  externalizados.
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil rápido
  live de Matrix y el carril de QA de Telegram antes de aprobar el lanzamiento. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI. Ejecuta el flujo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte
  Matrix, medios y E2EE en paralelo.
- La validación de tiempo de ejecución de instalación y actualización entre SO forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  flujo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas quedan en su
  propio carril para que no retrasen ni bloqueen la publicación
- Las comprobaciones de lanzamiento que portan secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de flujo `main`/release para que la lógica de flujo y los
  secretos sigan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o etiqueta de lanzamiento
- La comprobación preliminar solo de validación de `OpenClaw NPM Release` también acepta el SHA completo
  de 40 caracteres del commit actual de la rama de flujo sin requerir una etiqueta subida
- Esa ruta de SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos mantienen la ruta real de publicación y promoción en runners hospedados por GitHub,
  mientras la ruta de validación no mutante puede usar los runners Linux más grandes
  de Blacksmith
- Ese flujo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La comprobación preliminar de lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de aprobar
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding de paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el pool compartido de credenciales de Telegram arrendadas.
  Las pruebas locales puntuales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta validación de actualización npm de Parallels/objetivo fresco, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del flujo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento de mantenedores ahora usa comprobación preliminar y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución preliminar exitosa
  - los lanzamientos npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede dirigirse explícitamente a `latest` mediante la entrada del flujo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el
    repositorio público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una
    rama de lanzamiento pero el flujo se despacha desde `main`, establece
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe pasar `preflight_run_id` y
    `validate_run_id` privados de mac exitosos
  - las rutas reales de publicación promueven artefactos preparados en lugar de reconstruirlos
    otra vez
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas con el
  payload estable base
- La comprobación preliminar de lanzamiento npm falla cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como un payload no vacío en `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y
  los metadatos de paquetes estén presentes en el layout instalado desde el registro. Un lanzamiento que
  envíe payloads faltantes de tiempo de ejecución de plugins falla el verificador posterior a la publicación y
  no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del paquete npm en
  el tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del paquete
  antes de la ruta de publicación de lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de temporización de plugins o
  matrices de prueba de plugins, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador de
  `.github/workflows/plugin-prerelease.yml` antes de aprobar para que las notas de lanzamiento no
  describan un layout obsoleto de CI
- La preparación de lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe mantener un id de bundle no debug, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle
    para esa versión de lanzamiento

## Cajas de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un solo punto de entrada. Para una prueba de commit fijado en una rama que se mueve rápido, usa el
helper para que cada flujo hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper sube `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija más nueva de `main`.

Para la validación de rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo `main`
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

El flujo de trabajo resuelve la referencia de destino, despacha el `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto principal `release-package-under-test` para las comprobaciones orientadas a paquetes y
despacha el E2E independiente de paquete Telegram cuando `release_profile=full` con
`rerun_group=all` o cuando `npm_telegram_package_spec` está definido. Luego `OpenClaw Release
Checks` se despliega en smoke de instalación, comprobaciones de lanzamiento entre sistemas operativos, cobertura live/E2E de la ruta de lanzamiento Docker
cuando el soak está habilitado, Package Acceptance con QA de paquete Telegram,
paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa solo es aceptable cuando el
resumen de `Full Release Validation`
muestra `normal_ci` y `release_checks` como correctos. En modo full/all,
el hijo `npm_telegram` también debe completarse correctamente; fuera de full/all se omite
a menos que se haya proporcionado un `npm_telegram_package_spec` publicado. El resumen final del
verificador incluye tablas de trabajos más lentos para cada ejecución hija, de modo que el release
manager pueda ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la
matriz completa de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias entre los perfiles stable y full,
los artefactos y los identificadores de repetición enfocados.
Los flujos de trabajo hijos se despachan desde la referencia confiable que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una
rama o etiqueta de lanzamiento anterior. No existe una entrada separada de referencia de flujo de trabajo de Full Release Validation; elige el arnés confiable eligiendo la referencia de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para prueba exacta de commit sobre `main` móvil;
los SHA de commit sin procesar no pueden ser referencias de despacho de flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: la ruta OpenAI/core live y Docker crítica para el lanzamiento más rápida
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de lanzamiento
- `full`: stable más cobertura amplia consultiva de proveedores/medios

Usa `run_release_soak=true` con `stable` cuando los lanes bloqueantes de lanzamiento estén
en verde y quieras el barrido exhaustivo live/E2E, ruta de lanzamiento Docker y
barrido acotado de supervivencia a actualizaciones publicadas antes de la promoción. Ese barrido cubre
los cuatro paquetes stable más recientes más las líneas base fijadas `2026.4.23` y `2026.5.2`
más cobertura anterior `2026.4.15`, con líneas base duplicadas eliminadas y
cada línea base fragmentada en su propio trabajo de runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo confiable para resolver la referencia de destino
una vez como `release-package-under-test` y reutiliza ese artefacto en comprobaciones cross-OS,
Package Acceptance y Docker de ruta de lanzamiento cuando se ejecuta el soak. Esto mantiene
todas las máquinas orientadas a paquetes sobre los mismos bytes y evita compilaciones de paquete repetidas.
El smoke de instalación OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/org está definida; de lo contrario, usa `openai/gpt-5.4`, porque este lane
prueba la instalación del paquete, el onboarding, el arranque del gateway y un turno de agente en vivo
en lugar de medir el modelo predeterminado más lento. La matriz live de proveedores más amplia
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

No uses el paraguas completo como primera repetición después de una corrección enfocada. Si una máquina
falla, usa el flujo de trabajo hijo, el trabajo, el lane Docker, el perfil de paquete, el proveedor de modelo
o el lane QA fallidos para la siguiente prueba. Ejecuta el paraguas completo de nuevo solo cuando
la corrección haya cambiado la orquestación de lanzamiento compartida o haya vuelto obsoleta la evidencia previa de todas las máquinas.
El verificador final del paraguas vuelve a comprobar los ids registrados de ejecuciones de flujos de trabajo hijos, así que después de que un flujo de trabajo hijo se repita correctamente, vuelve a ejecutar solo el trabajo padre
`Verify full validation` fallido.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
de release-candidate, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease`
ejecuta solo el hijo de Plugin exclusivo de lanzamiento, `release-checks` ejecuta todas las máquinas de lanzamiento,
y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las repeticiones enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all
con `release_profile=full` usan el artefacto de paquete de release-checks. Las repeticiones enfocadas
cross-OS pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u
otro filtro de OS/suite. Los fallos de QA de release-check son consultivos; un fallo solo de QA
no bloquea la validación de lanzamiento.

### Vitest

La máquina Vitest es el flujo de trabajo hijo `CI` manual. El CI manual omite
intencionadamente el alcance de cambios y fuerza el grafo de pruebas normal para el candidato de lanzamiento:
fragmentos Linux Node, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22,
`check`, `check-additional`, smoke de compilación, comprobaciones de docs, Skills de Python, Windows, macOS, Android y i18n de Control UI.

Usa esta máquina para responder "¿pasó el árbol de código fuente la suite de pruebas normal completa?"
No es lo mismo que la validación de producto de ruta de lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de ejecución de `CI` despachada
- ejecución de `CI` en verde en el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempo de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesite CI normal determinista pero
no las máquinas Docker, QA Lab, live, cross-OS o de paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La máquina Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo en modo lanzamiento
`install-smoke`. Valida el candidato de lanzamiento mediante entornos Docker empaquetados
en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de lanzamiento incluye:

- smoke completo de instalación con el smoke lento de instalación global de Bun habilitado
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA de destino, con trabajos smoke de QR,
  root/gateway e instalador/Bun ejecutándose como fragmentos separados de install-smoke
- lanes E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicite
- lanes divididos de instalación/desinstalación de plugins incluidos
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites live/E2E de proveedores y cobertura de modelos Docker live cuando las comprobaciones de lanzamiento
  incluyen suites live

Usa los artefactos Docker antes de repetir. El planificador de ruta de lanzamiento sube
`.artifacts/docker-tests/` con registros de lanes, `summary.json`, `failures.json`,
tiempos de fases, JSON del planificador y comandos de repetición. Para recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de
repetir todos los fragmentos de lanzamiento. Los comandos de repetición generados incluyen el
`package_artifact_run_id` anterior y entradas de imagen Docker preparadas cuando estén disponibles, para que un
lane fallido pueda reutilizar el mismo tarball y las mismas imágenes GHCR.

### QA Lab

La máquina QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento de
comportamiento agéntico y nivel de canal, separada de Vitest y la mecánica de paquetes Docker.

La cobertura QA Lab de lanzamiento incluye:

- lane de paridad mock que compara el lane candidato OpenAI contra la línea base Opus 4.6
  usando el paquete de paridad agéntica
- perfil rápido de QA live Matrix usando el entorno `qa-live-shared`
- lane QA live Telegram usando leases de credenciales Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta máquina para responder "¿se comporta correctamente el lanzamiento en escenarios QA y
flujos de canales en vivo?" Conserva las URL de artefactos de los lanes de paridad, Matrix y Telegram
al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como
ejecución QA-Lab manual fragmentada en lugar de ser el lane crítico de lanzamiento predeterminado.

### Paquete

La máquina Package es la puerta de producto instalable. Está respaldada por
`Package Acceptance` y el resolver
`scripts/resolve-openclaw-package-candidate.mjs`. El resolver normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene la
referencia del arnés de flujo de trabajo separada de la referencia fuente del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo de `package_ref` confiable
  con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` requerido
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de lanzamiento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, actualización,
reinicio tras actualización con auth configurada, limpieza de dependencias obsoletas de plugins, fixtures de plugins sin conexión,
actualización de plugins y QA de paquete Telegram contra el mismo tarball resuelto.
Las comprobaciones bloqueantes de lanzamiento usan la línea base predeterminada del paquete publicado más reciente;
`run_release_soak=true` o
`release_profile=full` se expande a todas las líneas base stable publicadas en npm desde
`2026.4.23` hasta `latest` más fixtures de incidencias reportadas. Usa
Package Acceptance con `source=npm` para un candidato ya publicado, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes de
publicar. Es el reemplazo nativo de GitHub
para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería
Parallels. Las comprobaciones de lanzamiento cross-OS siguen importando para onboarding,
instalador y comportamiento de plataforma específicos del sistema operativo, pero la validación de producto de paquetes/actualizaciones debe
preferir Package Acceptance.

La lista de comprobación canónica para validación de actualizaciones y plugins es
[Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué lane local, Docker, Package Acceptance o de release-check prueba un
cambio de instalación/actualización de plugins, limpieza de doctor o migración de paquetes publicados.
La migración exhaustiva de actualización publicada desde cada paquete stable `2026.4.23+` es
un flujo de trabajo manual `Update Migration` separado, no forma parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionalmente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas
en npm: entradas privadas del inventario de QA ausentes del tarball, falta de
`gateway install --wrapper`, archivos de parche ausentes en el fixture de git
derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros
de instalación de plugin, falta de persistencia del registro de instalación del marketplace
y migración de metadatos de configuración durante `plugins update`. El paquete publicado
`2026.4.26` puede advertir sobre archivos locales de sello de metadatos de compilación
que ya se habían distribuido. Los paquetes posteriores deben cumplir los contratos modernos
de paquete; esas mismas brechas hacen fallar la validación de versión.

Usa perfiles de Package Acceptance más amplios cuando la pregunta de la versión sea sobre un
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

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red del Gateway y recarga
  de configuración
- `package`: contratos de instalación/actualización/reinicio/paquete de plugin sin ClawHub
  en vivo; este es el valor predeterminado de la comprobación de versión
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos de ruta de versión de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para prueba de Telegram de un candidato de paquete, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El workflow pasa el tarball
resuelto `package-under-test` al carril de Telegram; el workflow independiente
de Telegram todavía acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de versiones

`OpenClaw Release Publish` es el punto de entrada normal de publicación con mutaciones. Orquesta
los workflows de publicador de confianza en el orden que la versión necesita:

1. Hace checkout de la etiqueta de versión y resuelve su SHA de commit.
2. Verifica que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecuta `pnpm plugins:sync:check`.
4. Despacha `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despacha `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despacha `OpenClaw NPM Release` con la etiqueta de versión, la dist-tag de npm y
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

Usa los workflows de menor nivel `Plugin NPM Release` y `Plugin ClawHub Release`
solo para trabajos enfocados de reparación o republicación. Para una reparación de plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha el workflow secundario directamente cuando el
paquete OpenClaw no deba publicarse.

## Entradas del workflow de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión requerida, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo actual de 40 caracteres de la rama del workflow para un preflight solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el workflow reutilice
  el tarball preparado desde la ejecución de preflight correcta
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión requerida; ya debe existir
- `preflight_run_id`: id de ejecución de preflight correcto de `OpenClaw NPM Release`;
  requerido cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta npm de destino para el paquete OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establécelo en `false` solo cuando uses el
  workflow como orquestador de reparación solo de plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo que validar. Las comprobaciones con secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o una
  etiqueta de versión.
- `run_release_soak`: opta por pruebas exhaustivas en vivo/E2E, ruta de versión de Docker y
  soak de supervivencia de actualización all-since en comprobaciones de versión estable/predeterminada. Se fuerza
  cuando `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas beta de preversión solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante el preflight;
  el workflow verifica que esos metadatos sigan antes de publicar

## Secuencia de versión npm estable

Al preparar una versión npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo actual de la rama del workflow
     para una ejecución en seco solo de validación del workflow de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de versión, la etiqueta de versión o el SHA de commit completo
   cuando quieras CI normal más cobertura de caché de prompt en vivo, Docker, QA Lab,
   Matrix y Telegram desde un workflow manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   workflow manual `CI` en la ref de versión en su lugar
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica plugins externalizados en npm
   y ClawHub antes de promover el paquete npm OpenClaw
7. Si la versión llegó a `beta`, usa el workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si la versión se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo workflow privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autorreparación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a autenticación npm local, ejecuta cualquier comando de la CLI
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

Los mantenedores usan la documentación privada de versiones en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.

## Relacionado

- [Canales de versión](/es/install/development-channels)
