---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de lanzamiento o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, cajas de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-03T21:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales públicos de publicación:

- stable: publicaciones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de versión preliminar que se publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de publicación estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión preliminar beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la publicación estable actual promocionada en npm
- `beta` significa el destino actual de instalación beta
- Las publicaciones estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de publicación pueden dirigirlas explícitamente a `latest`, o promocionar más tarde una compilación beta revisada
- Cada publicación estable de OpenClaw entrega el paquete npm y la app de macOS juntos;
  las publicaciones beta normalmente validan y publican primero la ruta de npm/paquete, con
  la compilación/firma/notarización de la app de Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de publicación

- Las publicaciones avanzan primero por beta
- Estable viene solo después de validar la beta más reciente
- Los mantenedores normalmente cortan publicaciones desde una rama `release/YYYY.M.D` creada
  desde el `main` actual, para que la validación y las correcciones de publicación no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores cortan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de publicación, aprobaciones, credenciales y notas de recuperación es
  solo para mantenedores

## Lista de verificación del operador de publicación

Esta lista de verificación es la forma pública del flujo de publicación. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en
el runbook de publicación solo para mantenedores.

1. Empieza desde el `main` actual: trae lo último, confirma que el commit objetivo se haya enviado,
   y confirma que el CI actual de `main` esté lo bastante verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, confírmala, envíala, y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de publicación en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la
   compatibilidad expirada solo cuando la ruta de actualización siga cubierta, o registra por qué se
   conserva intencionadamente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas el trabajo normal de publicación
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes de Plugin publicables compartan la versión de publicación
   y los metadatos de compatibilidad, y luego ejecuta la preflight determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de publicación para una preflight
   solo de validación. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas a la publicación con `Full Release Validation` para la
   rama de publicación, la etiqueta o el SHA completo del commit. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de publicación: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de publicación y vuelve a ejecutar el archivo, canal,
   job de workflow, perfil de paquete, proveedor o lista de permitidos de modelos más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada haga
   que la evidencia previa quede obsoleta.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   publica primero todos los paquetes de Plugin publicables en npm, publica después el mismo
   conjunto en ClawHub como tarballs npm-pack de ClawPack, y luego promociona el
   artefacto de preflight npm de OpenClaw preparado con el dist-tag correspondiente. Después de
   publicar, ejecuta la aceptación de paquetes posterior a la publicación
   contra el paquete publicado `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Si una versión preliminar enviada o publicada necesita una corrección,
   corta el siguiente número de versión preliminar correspondiente; no elimines ni reescribas la
   versión preliminar anterior.
10. Para estable, continúa solo después de que la beta revisada o el candidato de publicación tenga la
    evidencia de validación requerida. La publicación estable en npm también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto de preflight exitoso mediante
    `preflight_run_id`; la preparación de la publicación estable para macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador npm posterior a la publicación, el E2E opcional independiente
    de Telegram con npm publicado cuando necesites prueba del canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, las notas de publicación/versión preliminar de GitHub desde la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio de la publicación.

## Preflight de publicación

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de ciclos de
  importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados
  `dist/*` y el paquete de Control UI existan para el paso de validación
  del paquete
- Ejecuta `pnpm plugins:sync` después del incremento de versión raíz y antes de etiquetar. Actualiza las versiones de paquetes de Plugin publicables, los metadatos de compatibilidad de pares/API de OpenClaw, los metadatos de compilación y los stubs de changelog de Plugin para que coincidan con la versión de lanzamiento del núcleo. `pnpm plugins:sync:check` es la guarda de lanzamiento no mutante;
  el flujo de trabajo de publicación falla antes de cualquier mutación del registro si este paso se
  olvidó.
- Ejecuta manualmente el flujo de trabajo `Full Release Validation` antes de aprobar el lanzamiento para
  iniciar todos los entornos de prueba de prelanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para smoke de instalación, aceptación de paquete, suites de ruta de lanzamiento de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. Con `release_profile=full` y `rerun_group=all`, también ejecuta E2E de paquete Telegram contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento. Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo E2E de Telegram también deba probar el paquete npm publicado. Proporciona `package_acceptance_package_spec` después de publicar cuando Package Acceptance deba ejecutar su matriz de paquete/actualización contra el paquete npm enviado en lugar del artefacto compilado desde el SHA. Proporciona
  `evidence_package_spec` cuando el informe privado de evidencia deba probar que la
  validación coincide con un paquete npm publicado sin forzar E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta manualmente el flujo de trabajo `Package Acceptance` cuando quieras prueba de canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El flujo de trabajo resuelve el candidato a
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles de Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto para paquete/actualización/Plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una reejecución enfocada
- Ejecuta manualmente el flujo de trabajo `CI` directamente cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Linux Node, shards de plugins incluidos, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación,
  comprobaciones de docs, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de traza exportados, atributos acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse ni otro colector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que la
  etiqueta exista. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento y el `preflight_run_id` exitoso de npm de OpenClaw, y conserva el alcance predeterminado de publicación de Plugin
  `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El
  flujo de trabajo serializa la publicación npm de Plugin, la publicación de Plugin en ClawHub y la publicación npm de OpenClaw para que el paquete principal no se publique antes de sus
  plugins externalizados.
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil live rápido de Matrix y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles live usan el entorno `qa-live-shared`; Telegram también usa concesiones de credenciales de Convex CI. Ejecuta manualmente el flujo de trabajo `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras en paralelo el inventario completo de transporte, medios y E2EE de Matrix.
- La validación en tiempo de ejecución de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  flujo de trabajo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento npm corta,
  determinista y enfocada en artefactos, mientras que las comprobaciones live más lentas permanecen en su
  propio carril para que no detengan ni bloqueen la publicación
- Las comprobaciones de lanzamiento que contienen secretos deben despacharse mediante `Full Release
Validation` o desde la referencia de flujo de trabajo `main`/release para que la lógica del flujo de trabajo y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre que
  el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- El preflight solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres del commit de la rama de flujo de trabajo sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real aún requiere una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners hospedados en GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- El preflight de lanzamiento npm ya no espera el carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal limpio
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales Telegram concedidas. Las ejecuciones locales puntuales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento para mantenedores ahora usa preflight-y-luego-promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución de preflight exitosa
  - los lanzamientos npm estables predeterminan a `beta`
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante entrada del flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el
    repo público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una
    rama de lanzamiento pero el flujo de trabajo se despacha desde `main`, configura
    `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de Mac debe pasar `preflight_run_id` y
    `validate_run_id` privados de Mac exitosos
  - las rutas reales de publicación promueven artefactos preparados en lugar de reconstruirlos
    de nuevo
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización en prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la
  carga estable base
- El preflight de lanzamiento npm falla cerrado salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los entrypoints de Plugin publicados y
  los metadatos del paquete estén presentes en el diseño de registro instalado. Un lanzamiento que
  envía cargas de runtime de Plugin faltantes falla el verificador postpublish y
  no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` de npm pack en
  el tarball de actualización candidato, de modo que el e2e del instalador detecte crecimiento accidental del paquete
  antes de la ruta de publicación de lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensión o
  matrices de pruebas de extensión, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un diseño de CI obsoleto
- La preparación para el lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe conservar un bundle id no debug, una URL de feed de Sparkle no vacía
    y un `CFBundleVersion` igual o superior al piso canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Entornos de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas de prelanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama que se mueve rápido, usa el
helper para que cada flujo de trabajo hijo se ejecute desde una rama temporal fijada en el SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo de trabajo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija de `main` más nueva.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo de trabajo `main` de confianza
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

El flujo de trabajo resuelve la ref de destino, despacha manualmente `CI` con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto padre `release-package-under-test` para las comprobaciones orientadas
a paquetes, y despacha el E2E independiente del paquete Telegram cuando
`release_profile=full` con `rerun_group=all` o cuando se define
`npm_telegram_package_spec`. Luego, `OpenClaw Release
Checks` se expande a smoke de instalación, comprobaciones de lanzamiento
multisistema, cobertura de la ruta de lanzamiento Docker live/E2E, Package Acceptance con QA del paquete Telegram, paridad de QA Lab,
Matrix live y Telegram live. Una ejecución completa solo es aceptable cuando el
resumen de `Full Release Validation`
muestra `normal_ci` y `release_checks` como correctos. En modo full/all,
el hijo `npm_telegram` también debe completarse correctamente; fuera de full/all se omite
salvo que se haya proporcionado un `npm_telegram_package_spec` publicado. El resumen final
del verificador incluye tablas de los trabajos más lentos para cada ejecución hija, de modo que el responsable del lanzamiento pueda ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la
matriz completa de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias
entre los perfiles stable y full, los artefactos y los identificadores de reejecución enfocados.
Los flujos de trabajo hijos se despachan desde la ref confiable que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una
rama o etiqueta de lanzamiento más antigua. No hay una entrada separada de ref de flujo de trabajo para Full Release Validation; elige el arnés confiable eligiendo la ref de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` como prueba de commit exacto en un `main` móvil;
los SHA de commit sin procesar no pueden ser refs de despacho de flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar el alcance live/de proveedores:

- `minimum`: la ruta Docker y live de OpenAI/core crítica para el lanzamiento más rápida
- `stable`: mínimo más cobertura estable de proveedor/backend para la aprobación del lanzamiento
- `full`: estable más cobertura amplia de proveedor/medios de advertencia

`OpenClaw Release Checks` usa la ref confiable del flujo de trabajo para resolver la ref de destino
una vez como `release-package-under-test` y reutiliza ese artefacto tanto en
las comprobaciones Docker de ruta de lanzamiento como en Package Acceptance. Esto mantiene todas las
máquinas orientadas a paquetes en los mismos bytes y evita compilaciones repetidas del paquete.
El smoke de instalación OpenAI multisistema usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/org está definida; de lo contrario, `openai/gpt-5.4`, porque este carril
prueba la instalación del paquete, el onboarding, el inicio del Gateway y un turno live de agente,
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

No uses el paraguas completo como primera reejecución después de una corrección enfocada. Si una máquina
falla, usa el flujo de trabajo hijo, el trabajo, el carril Docker, el perfil de paquete, el proveedor
del modelo o el carril de QA que falló para la siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando
la corrección haya cambiado la orquestación compartida del lanzamiento o haya vuelto obsoleta la evidencia previa
de todas las máquinas. El verificador final del paraguas vuelve a comprobar los ids de ejecución de flujos de trabajo hijos registrados, así que después de que un flujo de trabajo hijo se reejecute correctamente, reejecuta solo el trabajo padre `Verify full validation` fallido.

Para una recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
de candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease`
ejecuta solo el hijo de plugin exclusivo del lanzamiento, `release-checks` ejecuta todas las
máquinas de lanzamiento, y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las reejecuciones enfocadas de `npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all
con `release_profile=full` usan el artefacto de paquete de release-checks.

### Vitest

La máquina Vitest es el flujo de trabajo hijo manual `CI`. El CI manual omite intencionalmente
el alcance por cambios y fuerza el grafo normal de pruebas para el candidato de lanzamiento: shards Linux Node, shards de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, Android e i18n de Control UI.

Usa esta máquina para responder "¿el árbol de código fuente aprobó la suite normal completa de pruebas?"
No es lo mismo que la validación del producto por la ruta de lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestre la URL de la ejecución `CI` despachada
- ejecución `CI` en verde en el SHA de destino exacto
- nombres de shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesite CI normal determinista, pero
no las máquinas Docker, QA Lab, live, multisistema o de paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La máquina Docker reside en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo
`install-smoke` en modo lanzamiento. Valida el candidato de lanzamiento mediante entornos Docker empaquetados, en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de lanzamiento incluye:

- smoke completo de instalación con el smoke de instalación global Bun lento habilitado
- preparación/reutilización de la imagen smoke del Dockerfile raíz por SHA de destino, con trabajos smoke de QR,
  root/Gateway e instalador/Bun ejecutándose como shards separados de install-smoke
- carriles E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicite
- carriles divididos de instalación/desinstalación de plugins incluidos
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites live/E2E de proveedores y cobertura de modelos Docker live cuando las comprobaciones de lanzamiento
  incluyen suites live

Usa los artefactos Docker antes de reejecutar. El planificador de ruta de lanzamiento sube
`.artifacts/docker-tests/` con registros de carriles, `summary.json`, `failures.json`,
tiempos de fases, JSON del plan del planificador y comandos de reejecución. Para recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de
reejecutar todos los fragmentos de lanzamiento. Los comandos de reejecución generados incluyen el
`package_artifact_run_id` anterior y entradas de imágenes Docker preparadas cuando están disponibles, de modo que un
carril fallido pueda reutilizar el mismo tarball e imágenes GHCR.

### QA Lab

La máquina QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento de
comportamiento agente y nivel de canal, separada de Vitest y de la mecánica de paquetes Docker.

La cobertura QA Lab de lanzamiento incluye:

- carril de paridad mock que compara el carril candidato OpenAI con la línea base Opus 4.6
  usando el paquete de paridad agente
- perfil rápido de QA Matrix live usando el entorno `qa-live-shared`
- carril QA de Telegram live usando leases de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta máquina para responder "¿el lanzamiento se comporta correctamente en escenarios de QA y flujos de canales live?" Conserva las URL de artefactos de los carriles de paridad, Matrix y Telegram
al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una ejecución manual fragmentada de QA-Lab, en lugar del carril crítico de lanzamiento predeterminado.

### Paquete

La máquina de paquete es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolutor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolutor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene la
ref del arnés del flujo de trabajo separada de la ref de origen del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo `package_ref` confiable
  con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS con `package_sha256` obligatorio
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto preparado del paquete de lanzamiento, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` y
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la actualización, la limpieza de dependencias obsoletas de plugins, los fixtures de plugins offline, la actualización de plugins y la QA del paquete Telegram contra el mismo tarball resuelto. La matriz de actualización cubre todas las líneas base estables publicadas en npm desde `2026.4.23` hasta `latest`; usa
Package Acceptance con `source=npm` para un candidato ya enviado, o
`source=ref`/`source=artifact` para un tarball npm local respaldado por SHA antes de
publicar. Es el reemplazo nativo de GitHub
para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería
Parallels. Las comprobaciones de lanzamiento multisistema siguen siendo importantes para onboarding,
instalador y comportamiento específico de plataforma, pero la validación de producto de paquetes/actualizaciones debería
preferir Package Acceptance.

La lista de verificación canónica para validación de actualizaciones y plugins es
[Probar actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué carril local, Docker, Package Acceptance o release-check prueba un
cambio de instalación/actualización de plugin, limpieza de doctor o migración de paquete publicado.
La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es
un flujo de trabajo manual `Update Migration` separado, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionalmente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas
en npm: entradas privadas de inventario de QA ausentes del tarball, ausencia de
`gateway install --wrapper`, ausencia de archivos de parche en el fixture git derivado del tarball,
ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins,
ausencia de persistencia de registros de instalación del marketplace y migración de metadatos de configuración
durante `plugins update`. El paquete `2026.4.26` publicado puede advertir
por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores
deben satisfacer los contratos de paquete modernos; esas mismas brechas fallan la validación de lanzamiento.

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

Perfiles comunes de paquete:

- `smoke`: vías rápidas de instalación de paquete/canal/agente, red de Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/paquete de Plugin sin ClawHub en vivo; este es el valor predeterminado de comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de Cron/subagente, búsqueda web de OpenAI y OpenWebUI
- `full`: fragmentos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram del paquete candidato, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball
resuelto de `package-under-test` a la vía de Telegram; el flujo de trabajo independiente de
Telegram todavía acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamiento

`OpenClaw Release Publish` es el punto de entrada de publicación mutante normal. Orquesta
los flujos de trabajo de publicador de confianza en el orden que necesita el lanzamiento:

1. Extraer la etiqueta de lanzamiento y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo ámbito y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de lanzamiento, la etiqueta dist de npm y
   el `preflight_run_id` guardado.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publicación estable con la etiqueta dist beta predeterminada:

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
`OpenClaw Release Publish`, o despacha el flujo de trabajo secundario directamente cuando el
paquete OpenClaw no deba publicarse.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo de 40 caracteres de la rama del flujo de trabajo actual para una prueba preliminar solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución preliminar correcta
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución preliminar correcta de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta npm de destino para el paquete OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo cuando uses el
  flujo de trabajo como orquestador de reparación solo de Plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones con secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o
  etiqueta de lanzamiento.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas beta de prelanzamiento solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la prueba preliminar;
  el flujo de trabajo verifica esos metadatos antes de que la publicación continúe

## Secuencia de lanzamiento estable de npm

Al preparar un lanzamiento estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo de la rama del flujo de trabajo actual
     para una ejecución de prueba solo de validación del flujo de trabajo preliminar
2. Elige `npm_dist_tag=beta` para el flujo normal que publica primero en beta, o `latest` solo
   cuando quieras intencionadamente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de commit
   completo cuando quieras CI normal más caché de prompts en vivo, Docker, QA Lab,
   Matrix y cobertura de Telegram desde un solo flujo de trabajo manual
4. Si intencionadamente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   flujo de trabajo manual `CI` en la referencia de lanzamiento en su lugar
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica los Plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas etiquetas dist a la versión estable, o deja que su sincronización programada
   de autorreparación mueva `beta` más tarde

La mutación de etiquetas dist vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene una publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción que publica primero en beta
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la
CLI de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op`
directamente desde la shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
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
