---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de versiones o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, cajas de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-05-05T05:24:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales públicos de lanzamiento:

- estable: versiones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: la cabeza móvil de `main`

## Nombres de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento estable de corrección: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión estable actual promovida en npm
- `beta` significa el destino actual de instalación beta
- Las versiones estables y estables de corrección se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más tarde una compilación beta revisada
- Cada versión estable de OpenClaw distribuye el paquete npm y la app de macOS juntos;
  las versiones beta normalmente validan y publican primero la ruta npm/paquete, con
  la compilación/firma/notarización de la app de mac reservada para estable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Estable llega solo después de validar la beta más reciente
- Los mantenedores normalmente preparan lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir del `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el desarrollo nuevo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación es
  solo para mantenedores

## Lista de verificación del operador de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en
el manual de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo último, confirma que el commit de destino se ha enviado,
   y confirma que la CI actual de `main` está lo bastante verde como para crear una rama desde él.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, envíalo y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina compatibilidad caducada
   solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva
   intencionadamente.
4. Crea `release/YYYY.M.D` desde el `main` actual; no hagas trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista, ejecuta
   `pnpm plugins:sync` para que los paquetes de Plugin publicables compartan la versión de lanzamiento
   y los metadatos de compatibilidad, y luego ejecuta la comprobación previa determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, y
   `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento solo para validación
   previa. Guarda el `preflight_run_id` correcto.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA de commit completo. Este es el único punto de entrada manual
   para las cuatro grandes cajas de pruebas de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, canal,
   trabajo de workflow, perfil de paquete, proveedor o lista de modelos permitidos más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada vuelva obsoleta
   la evidencia previa.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, luego ejecuta `OpenClaw Release Publish` desde
   la rama `release/YYYY.M.D` correspondiente. Verifica `pnpm plugins:sync:check`,
   publica primero todos los paquetes de Plugin publicables en npm, publica el mismo
   conjunto en ClawHub en segundo lugar como tarballs ClawPack npm-pack, y luego promueve el
   artefacto preparado de comprobación previa de npm de OpenClaw con el dist-tag correspondiente. Después de
   publicar, ejecuta la aceptación de paquete posterior a la publicación
   contra el paquete publicado `openclaw@YYYY.M.D-beta.N` u
   `openclaw@beta`. Si un prelanzamiento enviado o publicado necesita una corrección,
   crea el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el
   prelanzamiento anterior.
10. Para estable, continúa solo después de que la beta revisada o el candidato de lanzamiento tenga la
    evidencia de validación requerida. La publicación estable en npm también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto correcto de comprobación previa mediante
    `preflight_run_id`; la preparación del lanzamiento estable para macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados, y el `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, la E2E opcional de Telegram
    publicada de npm independiente cuando necesites prueba de canal posterior a la publicación,
    promoción de dist-tag cuando sea necesario, notas de lanzamiento/prelanzamiento de GitHub a partir de la
    sección completa correspondiente de `CHANGELOG.md`, y los pasos de anuncio del lanzamiento.

## Comprobación previa de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa de lanzamiento para que el TypeScript de pruebas siga cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa de lanzamiento para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de lanzamiento esperados `dist/*` y el paquete de Control UI para el paso de validación del paquete
- Ejecuta `pnpm plugins:sync` después de incrementar la versión raíz y antes de etiquetar. Actualiza las versiones de paquetes de plugins publicables, los metadatos de compatibilidad de pares/API de OpenClaw, los metadatos de compilación y los borradores de changelog de plugins para que coincidan con la versión principal del lanzamiento. `pnpm plugins:sync:check` es la guarda de lanzamiento no mutante; el flujo de publicación falla antes de cualquier mutación del registro si este paso se olvidó.
- Ejecuta el flujo manual `Full Release Validation` antes de aprobar el lanzamiento para iniciar todas las cajas de prueba previas al lanzamiento desde un único punto de entrada. Acepta una rama, etiqueta o SHA completo de commit, despacha `CI` manual y despacha `OpenClaw Release Checks` para humo de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas mantienen las pruebas live/E2E exhaustivas y la maduración de la ruta de lanzamiento Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza la maduración. Con `release_profile=full` y `rerun_group=all`, también ejecuta E2E de Telegram de paquete contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento. Proporciona `npm_telegram_package_spec` después de publicar cuando el mismo E2E de Telegram también deba probar el paquete npm publicado. Proporciona `package_acceptance_package_spec` después de publicar cuando Package Acceptance deba ejecutar su matriz de paquete/actualización contra el paquete npm enviado en vez del artefacto compilado desde el SHA. Proporciona `evidence_package_spec` cuando el informe privado de evidencia deba probar que la validación coincide con un paquete npm publicado sin forzar E2E de Telegram. Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo manual `Package Acceptance` cuando quieras prueba de canal lateral para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref` para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés `workflow_ref` actual; `source=url` para un tarball HTTPS con SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de GitHub Actions. El flujo resuelve el candidato a `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese tarball y puede ejecutar QA de Telegram contra el mismo tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como paquete bajo prueba, de modo que ejercita la ruta de reinicio gestionado del comando de actualización candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto para paquete/actualización/reinicio/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta el flujo manual `CI` directamente cuando solo necesites cobertura completa de CI normal para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios y fuerzan los shards Linux Node, shards de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, humo de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar telemetría de lanzamiento. Ejercita QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans de traza exportados, atributos acotados y redacción de contenido/identificadores sin requerir Opik, Langfuse u otro recopilador externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que exista la etiqueta. Despáchalo desde `release/YYYY.M.D` (o `main` al publicar una etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento y el `preflight_run_id` exitoso de npm de OpenClaw, y mantén el alcance de publicación de plugins predeterminado `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El flujo serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw para que el paquete principal no se publique antes de sus plugins externalizados.
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad simulada de QA Lab, además del perfil rápido live de Matrix y el carril QA de Telegram antes de la aprobación del lanzamiento. Los carriles live usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI. Ejecuta el flujo manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte, medios y E2EE de Matrix en paralelo.
- La validación de instalación y actualización en tiempo de ejecución entre sistemas operativos forma parte de los `OpenClaw Release Checks` públicos y de `Full Release Validation`, que llaman directamente al flujo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de lanzamiento npm breve, determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su propio carril para que no retrasen ni bloqueen la publicación
- Las comprobaciones de lanzamiento con secretos deben despacharse mediante `Full Release Validation` o desde la referencia de flujo `main`/release para que la lógica del flujo y los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres del commit de la rama del flujo sin requerir una etiqueta empujada
- Esa ruta de SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo sintetiza `v<package.json version>` solo para la comprobación de metadatos de paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos mantienen la ruta real de publicación y promoción en runners hospedados por GitHub, mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de Blacksmith
- Ese flujo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa de lanzamiento npm ya no espera el carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación desde el registro publicado en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding del paquete instalado, la configuración de Telegram y E2E real de Telegram contra el paquete npm publicado usando el grupo compartido de credenciales de Telegram arrendadas. Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el humo beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El asistente ejecuta la validación de actualización npm de Parallels/destino nuevo, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del flujo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta en cada merge.
- La automatización de lanzamientos de mantenedores ahora usa verificación previa y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` de npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o `release/YYYY.M.D` que la ejecución de verificación previa exitosa
  - los lanzamientos npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante entrada de flujo
  - la mutación basada en token de dist-tag de npm ahora vive en `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` por seguridad, porque `npm dist-tag add` aún necesita `NPM_TOKEN` mientras el repositorio público mantiene publicación solo con OIDC
  - el `macOS Release` público es solo de validación; cuando una etiqueta vive únicamente en una rama de lanzamiento pero el flujo se despacha desde `main`, establece `public_release_branch=release/YYYY.M.D`
  - la publicación privada real de mac debe pasar `preflight_run_id` y `validate_run_id` exitosos de mac privado
  - las rutas reales de publicación promueven artefactos preparados en vez de recompilarlos otra vez
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`, de modo que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la carga estable base
- La verificación previa de lanzamiento npm falla cerrada salvo que el tarball incluya tanto `dist/control-ui/index.html` como una carga no vacía `dist/control-ui/assets/`, para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y los metadatos de paquete estén presentes en el diseño del registro instalado. Un lanzamiento que envíe cargas de runtime de plugins faltantes falla el verificador postpublish y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también impone el presupuesto de `unpackedSize` del paquete npm sobre el tarball candidato de actualización, de modo que el e2e del instalador detecte crecimiento accidental del paquete antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de temporización de extensiones o matrices de pruebas de extensiones, regenera y revisa antes de la aprobación las salidas de matriz `plugin-prerelease-extension-shard` propiedad del planificador desde `.github/workflows/plugin-prerelease.yml`, para que las notas de lanzamiento no describan un diseño de CI obsoleto
- La preparación del lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe mantener un id de paquete no de depuración, una URL de feed de Sparkle no vacía y un `CFBundleVersion` igual o superior al piso canónico de compilación de Sparkle para esa versión de lanzamiento

## Cajas de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde un único punto de entrada. Para una prueba de commit fijado en una rama que se mueve rápido, usa el asistente para que cada flujo hijo se ejecute desde una rama temporal fijada al SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El asistente empuja `release-ci/<sha>-...`, despacha `Full Release Validation` desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo hijo coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una ejecución hija de `main` más nueva.

Para validación de rama o etiqueta de lanzamiento, ejecútala desde la referencia de flujo `main` de confianza y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El workflow resuelve la ref de destino, despacha `CI` manual con
`target_ref=<release-ref>`, despacha `OpenClaw Release Checks`, prepara un
artefacto padre `release-package-under-test` para las comprobaciones orientadas
a paquetes y despacha el E2E independiente del paquete de Telegram cuando
`release_profile=full` con `rerun_group=all` o cuando se define
`npm_telegram_package_spec`. Después, `OpenClaw Release Checks` despliega el
smoke de instalación, las comprobaciones de release entre sistemas operativos,
la cobertura live/E2E de la ruta de release de Docker cuando soak está
habilitado, Package Acceptance con QA del paquete de Telegram, paridad de QA
Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa solo es aceptable
cuando el resumen de `Full Release Validation` muestra `normal_ci` y
`release_checks` como correctos. En modo full/all, el hijo `npm_telegram` también
debe completarse correctamente; fuera de full/all se omite salvo que se haya
proporcionado un `npm_telegram_package_spec` publicado. El resumen final del
verificador incluye tablas de los jobs más lentos para cada ejecución hija, de
modo que el responsable de la release pueda ver la ruta crítica actual sin
descargar registros.
Consulta [Validación completa de release](/es/reference/full-release-validation)
para ver la matriz de etapas completa, los nombres exactos de los jobs del
workflow, las diferencias entre los perfiles stable y full, los artefactos y los
identificadores de reejecución enfocada.
Los workflows hijos se despachan desde la ref de confianza que ejecuta
`Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de
destino apunta a una rama o etiqueta de release más antigua. No hay una entrada
independiente de ref del workflow para Full Release Validation; elige el arnés
de confianza eligiendo la ref de ejecución del workflow. No uses
`--ref main -f ref=<sha>` como prueba de commit exacto en una `main` móvil; los
SHA de commit sin procesar no pueden ser refs de despacho de workflow, así que
usa `pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: ruta más rápida crítica para la release de OpenAI/core en vivo y Docker
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de release
- `full`: stable más cobertura amplia consultiva de proveedor/medios

Usa `run_release_soak=true` con `stable` cuando los lanes bloqueantes de la
release estén en verde y quieras el barrido exhaustivo live/E2E, de ruta de
release de Docker y acotado de supervivencia de actualización publicada antes
de la promoción. Ese barrido cubre los cuatro paquetes stable más recientes,
además de las líneas base fijadas `2026.4.23` y `2026.5.2`, más cobertura
anterior de `2026.4.15`, con las líneas base duplicadas eliminadas y cada línea
base fragmentada en su propio job runner de Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa la ref de workflow de confianza para resolver la
ref de destino una vez como `release-package-under-test` y reutiliza ese
artefacto en las comprobaciones entre sistemas operativos, Package Acceptance y
Docker de ruta de release cuando se ejecuta soak. Esto mantiene todas las
máquinas orientadas a paquetes sobre los mismos bytes y evita builds repetidos
del paquete. El smoke de instalación OpenAI entre sistemas operativos usa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la variable del repo/org está definida;
de lo contrario usa `openai/gpt-5.4`, porque este lane prueba la instalación del
paquete, el onboarding, el arranque del Gateway y un turno de agente en vivo,
no el rendimiento del modelo predeterminado más lento. La matriz live de
proveedores más amplia sigue siendo el lugar para la cobertura específica de
modelos.

Usa estas variantes según la etapa de la release:

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

No uses el paraguas completo como primera reejecución tras una corrección
enfocada. Si falla una máquina, usa el workflow hijo, el job, el lane de Docker,
el perfil de paquete, el proveedor de modelo o el lane de QA que haya fallado
para la siguiente prueba. Vuelve a ejecutar el paraguas completo solo cuando la
corrección haya cambiado la orquestación compartida de release o haya dejado
obsoleta la evidencia anterior de todas las máquinas. El verificador final del
paraguas vuelve a comprobar los ids registrados de las ejecuciones de workflows
hijos, así que, después de reejecutar correctamente un workflow hijo, reejecuta
solo el job padre fallido `Verify full validation`.

Para una recuperación acotada, pasa `rerun_group` al paraguas. `all` es la
ejecución real de candidata de release, `ci` ejecuta solo el hijo de CI normal,
`plugin-prerelease` ejecuta solo el hijo de Plugin exclusivo de release,
`release-checks` ejecuta todas las máquinas de release, y los grupos de release
más estrechos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` y `npm-telegram`. Las reejecuciones enfocadas de
`npm-telegram` requieren `npm_telegram_package_spec`; las ejecuciones full/all
con `release_profile=full` usan el artefacto de paquete de release-checks. Las
reejecuciones enfocadas entre sistemas operativos pueden añadir
`cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema
operativo/suite. Los fallos de release-checks de QA son consultivos; un fallo
solo de QA no bloquea la validación de release.

### Vitest

La máquina de Vitest es el workflow hijo manual `CI`. La CI manual omite
intencionadamente el alcance por cambios y fuerza el grafo de pruebas normal
para la candidata de release: shards de Linux Node, shards de Plugins
incluidos, contratos de canales, compatibilidad con Node 22, `check`,
`check-additional`, smoke de build, comprobaciones de documentación, Skills de
Python, Windows, macOS, Android y i18n de Control UI.

Usa esta máquina para responder "¿el árbol de código fuente pasó la suite de
pruebas normal completa?". No es lo mismo que la validación del producto por
ruta de release. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` en verde en el SHA de destino exacto
- nombres de shards fallidos o lentos de los jobs de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando una ejecución necesite análisis de rendimiento

Ejecuta la CI manual directamente solo cuando la release necesite CI normal
determinista pero no las máquinas de Docker, QA Lab, live, entre sistemas
operativos o paquete:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La máquina de Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del workflow
`install-smoke` en modo release. Valida la candidata de release mediante
entornos Docker empaquetados en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de release incluye:

- smoke de instalación completo con el smoke lento de instalación global de Bun habilitado
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA de destino, con jobs de QR, root/gateway e installer/Bun smoke ejecutándose como shards de install-smoke independientes
- lanes E2E del repositorio
- chunks Docker de ruta de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del chunk `plugins-runtime-services` cuando se solicita
- lanes divididos de instalación/desinstalación de Plugin incluido
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites live/E2E de proveedores y cobertura de modelo live de Docker cuando las comprobaciones de release incluyen suites live

Usa los artefactos de Docker antes de reejecutar. El planificador de ruta de
release sube `.artifacts/docker-tests/` con registros de lanes, `summary.json`,
`failures.json`, tiempos de fases, JSON del planificador y comandos de
reejecución. Para una recuperación enfocada, usa `docker_lanes=<lane[,lane]>`
en el workflow reutilizable live/E2E en lugar de reejecutar todos los chunks de
release. Los comandos de reejecución generados incluyen el
`package_artifact_run_id` anterior y las entradas de imagen Docker preparadas
cuando están disponibles, de modo que un lane fallido pueda reutilizar el mismo
tarball y las mismas imágenes GHCR.

### QA Lab

La máquina de QA Lab también forma parte de `OpenClaw Release Checks`. Es la
puerta de release de comportamiento agentic y a nivel de canal, separada de
Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab de release incluye:

- lane de paridad mock que compara el lane candidato de OpenAI con la línea base de Opus 4.6 usando el paquete de paridad agentic
- perfil rápido de QA de Matrix en vivo usando el entorno `qa-live-shared`
- lane de QA de Telegram en vivo usando arrendamientos de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de release necesita prueba local explícita

Usa esta máquina para responder "¿la release se comporta correctamente en
escenarios de QA y flujos de canales en vivo?". Conserva las URL de artefactos
de los lanes de paridad, Matrix y Telegram al aprobar la release. La cobertura
completa de Matrix sigue estando disponible como una ejecución manual
fragmentada de QA-Lab, en lugar de ser el lane predeterminado crítico para la
release.

### Paquete

La máquina de paquete es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza una
candidata en el tarball `package-under-test` consumido por Docker E2E, valida el
inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene
la ref del arnés del workflow separada de la ref de origen del paquete.

Fuentes de candidata admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA completo de commit de `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS con `package_sha256` obligatorio
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto preparado del paquete de release, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la
actualización, el reinicio tras actualización con autenticación configurada, la
limpieza de dependencias obsoletas de Plugin, los fixtures de Plugin offline, la
actualización de Plugin y la QA del paquete de Telegram contra el mismo tarball
resuelto. Las comprobaciones bloqueantes de release usan la línea base
predeterminada del último paquete publicado; `run_release_soak=true` o
`release_profile=full` se expanden a todas las líneas base stable publicadas en
npm desde `2026.4.23` hasta `latest`, más fixtures de incidencias reportadas.
Usa Package Acceptance con `source=npm` para una candidata ya publicada, o
`source=ref`/`source=artifact` para un tarball local npm respaldado por SHA
antes de publicar. Es el reemplazo nativo de GitHub para la mayor parte de la
cobertura de paquete/actualización que antes requería Parallels. Las
comprobaciones de release entre sistemas operativos siguen siendo importantes
para onboarding, instalador y comportamiento de plataforma específicos del
sistema operativo, pero la validación de producto de paquete/actualización
debería preferir Package Acceptance.

La lista de comprobación canónica para validación de actualizaciones y Plugins
es [Probar actualizaciones y Plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué lane local, de Docker, Package Acceptance o release-checks prueba un
cambio de instalación/actualización de Plugin, limpieza de doctor o migración de
paquete publicado. La migración exhaustiva de actualizaciones publicadas desde
cada paquete stable `2026.4.23+` es un workflow manual `Update Migration`
separado, no parte de Full Release CI.

La flexibilidad heredada de aceptación de paquetes está deliberadamente limitada en el tiempo. Los paquetes hasta
`2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas
en npm: entradas privadas del inventario de QA ausentes del tarball, ausencia de
`gateway install --wrapper`, archivos de parche ausentes en el fixture de git derivado del tarball,
ausencia de `update.channel` persistente, ubicaciones heredadas de registros de instalación de plugins,
ausencia de persistencia de registros de instalación del marketplace y migración de metadatos de configuración
durante `plugins update`. El paquete publicado `2026.4.26` puede advertir
por archivos locales de sello de metadatos de compilación que ya se enviaron. Los paquetes posteriores
deben cumplir los contratos modernos de paquetes; esas mismas brechas hacen fallar la validación
de versión.

Usa perfiles más amplios de Aceptación de paquetes cuando la pregunta de versión trate sobre un
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
  en vivo; este es el valor predeterminado de comprobación de versión
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI
  y OpenWebUI
- `full`: fragmentos de la ruta de versión de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para reejecuciones enfocadas

Para prueba de Telegram de candidato de paquete, habilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` en Aceptación de paquetes. El workflow pasa el tarball
resuelto de `package-under-test` al carril de Telegram; el workflow independiente
de Telegram sigue aceptando una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de versiones

`OpenClaw Release Publish` es el punto de entrada normal de publicación con mutaciones. Orquesta
los workflows de publicador de confianza en el orden que la versión necesita:

1. Extrae la etiqueta de la versión y resuelve su SHA de commit.
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

Usa los workflows de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release`
solo para trabajos enfocados de reparación o republicación. Para una reparación de Plugin seleccionado, pasa
`plugin_publish_scope=selected` y `plugins=@openclaw/name` a
`OpenClaw Release Publish`, o despacha el workflow hijo directamente cuando el
paquete de OpenClaw no deba publicarse.

## Entradas del workflow de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de commit
  completo de 40 caracteres de la rama de workflow actual para una preflight solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el workflow reutilice
  el tarball preparado de la ejecución de preflight exitosa
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución de preflight exitosa de `OpenClaw NPM Release`;
  obligatorio cuando `publish_openclaw_npm=true`
- `npm_dist_tag`: etiqueta de destino de npm para el paquete de OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo
  para trabajos enfocados de reparación
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo cuando uses el
  workflow como orquestador de reparación solo de plugins

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones que contienen secretos
  requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o una
  etiqueta de versión.
- `run_release_soak`: opta por pruebas exhaustivas en vivo/E2E, ruta de versión de Docker y
  soak de supervivencia de actualización desde todas las versiones anteriores en comprobaciones de versión estable/predeterminada. Se fuerza
  con `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicar en `beta` o `latest`
- Las etiquetas prerelease beta solo pueden publicar en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son
  solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la preflight;
  el workflow verifica esos metadatos antes de que continúe la publicación

## Secuencia de versión estable de npm

Al preparar una versión estable de npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA de commit completo de la rama de workflow actual
     para un ensayo sin publicación solo de validación del workflow de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionadamente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de versión, la etiqueta de versión o el SHA de
   commit completo cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab,
   Matrix y Telegram desde un workflow manual
4. Si intencionadamente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   workflow manual `CI` en la ref de la versión en su lugar
5. Guarda el `preflight_run_id` exitoso
6. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`
   y el `preflight_run_id` guardado; publica plugins externalizados en npm
   y ClawHub antes de promover el paquete npm de OpenClaw
7. Si la versión llegó a `beta`, usa el workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
8. Si la versión se publicó intencionadamente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo workflow privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada
   de autocorrección mueva `beta` más tarde

La mutación de dist-tags vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la CLI
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

Los mantenedores usan los documentos privados de versiones en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.

## Relacionado

- [Canales de versión](/es/install/development-channels)
