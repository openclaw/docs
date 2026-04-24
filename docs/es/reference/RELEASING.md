---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Buscando nomenclatura de versiones y cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-24T09:01:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw tiene tres canales públicos de lanzamiento:

- stable: lanzamientos etiquetados que publican en npm `beta` por defecto, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que publican en npm `beta`
- dev: el head móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento stable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección stable: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No uses relleno con ceros para mes o día
- `latest` significa el lanzamiento stable actual promovido en npm
- `beta` significa el destino actual de instalación beta
- Los lanzamientos stable y las correcciones stable publican en npm `beta` por defecto; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más tarde una build beta validada
- Cada lanzamiento stable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta de npm/paquete, y la compilación/firma/notarización de la app de macOS se reserva para stable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable solo sigue después de que se valida la beta más reciente
- Los mantenedores normalmente crean lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir del `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta ya se ha enviado o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de borrar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Preflight de lanzamiento

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la compuerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de
  ciclos de importación y límites de arquitectura estén en verde fuera de la compuerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los
  artefactos de lanzamiento esperados `dist/*` y el bundle de la interfaz de usuario de control para el paso de
  validación del pack
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la compuerta de paridad simulada de QA Lab más los
  canales QA en vivo de Matrix y Telegram antes de la aprobación del lanzamiento. Los canales en vivo usan el entorno
  `qa-live-shared`; Telegram también usa leases de credenciales de CI de Convex.
- La validación de runtime de instalación y actualización entre distintos SO se despacha desde el
  workflow llamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el workflow público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento en npm corta,
  determinista y centrada en artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su
  propio canal para que no ralenticen ni bloqueen la publicación
- Las comprobaciones de lanzamiento deben despacharse desde la referencia de workflow de `main` o desde una
  referencia de workflow `release/YYYY.M.D` para que la lógica del workflow y los secretos sigan
  controlados
- Ese workflow acepta una etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit de la rama de workflow
- En modo SHA de commit solo acepta el HEAD actual de la rama de workflow; usa una
  etiqueta de lanzamiento para commits de lanzamiento más antiguos
- El preflight solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres del commit de la rama de workflow sin requerir una etiqueta enviada
- Esa ruta de SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA el workflow sintetiza `v<package.json version>` solo para la comprobación de metadatos del
  paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners alojados por GitHub, mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de
  Blacksmith
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando ambos secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- El preflight del lanzamiento npm ya no espera al canal separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el pool compartido de credenciales de Telegram arrendadas.
  Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales env `OPENCLAW_QA_TELEGRAM_*`.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento de mantenedores ahora usa preflight-then-promote:
  - la publicación real en npm debe pasar un `preflight_run_id` exitoso de npm
  - la publicación real en npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución exitosa del preflight
  - los lanzamientos npm stable usan `beta` por defecto
  - la publicación npm stable puede apuntar explícitamente a `latest` mediante una entrada del workflow
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras que el
    repositorio público mantiene la publicación solo con OIDC
  - el `macOS Release` público es solo de validación
  - la publicación real privada de mac debe pasar un `preflight_run_id`
    y `validate_run_id` privados exitosos
  - las rutas de publicación real promueven artefactos preparados en lugar de volver a compilarlos
- Para lanzamientos de corrección stable como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente las instalaciones globales más antiguas en la carga útil stable base
- El preflight del lanzamiento npm falla de forma cerrada a menos que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía de `dist/control-ui/assets/`
  para no volver a enviar un panel del navegador vacío
- La verificación posterior a la publicación también comprueba que la instalación del registro publicado
  contenga dependencias de runtime no vacías de Plugins incluidos bajo el diseño raíz `dist/*`.
  Un lanzamiento que se distribuye con cargas útiles de dependencias de Plugins incluidas faltantes o vacías falla en el verificador posterior a la publicación y no puede promocionarse
  a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del npm pack sobre
  el tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del pack
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, los manifiestos de tiempos de extensiones o
  las matrices de pruebas de extensiones, regenera y revisa las salidas de matriz del workflow
  `checks-node-extensions` propiedad del planificador desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas del lanzamiento no describan un diseño de CI obsoleto
- La preparación para un lanzamiento stable de macOS también incluye las superficies del actualizador:
  - el lanzamiento en GitHub debe terminar con los archivos `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip stable después de la publicación
  - la app empaquetada debe mantener un bundle id no de depuración, una URL no vacía del feed de Sparkle
    y un `CFBundleVersion` igual o superior al umbral canónico de build de Sparkle
    para esa versión de lanzamiento

## Entradas del workflow de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el
  SHA completo actual de 40 caracteres del commit de la rama de workflow para preflight solo de validación
- `preflight_only`: `true` para solo validación/build/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el workflow reutilice
  el tarball preparado de la ejecución exitosa del preflight
- `npm_dist_tag`: dist-tag objetivo de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit de `main`
  para validar cuando se despacha desde `main`; desde una rama de lanzamiento, usa una
  etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit de la rama de lanzamiento

Reglas:

- Las etiquetas stable y de corrección pueden publicar en `beta` o `latest`
- Las etiquetas beta de prelanzamiento solo pueden publicar en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA completo de commit solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` es siempre solo de validación y también acepta el
  SHA actual de commit de la rama de workflow
- El modo SHA de commit de las comprobaciones de lanzamiento también requiere el HEAD actual de la rama de workflow
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante el preflight;
  el workflow verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento npm stable

Al crear un lanzamiento npm stable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo del commit actual de la rama de workflow
     para una ejecución en seco solo de validación del workflow de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal de beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación stable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual de la rama de workflow cuando quieras cobertura en vivo de caché de prompts,
   paridad de QA Lab, Matrix y Telegram
   - Esto es independiente a propósito para que la cobertura en vivo siga disponible sin
     volver a acoplar comprobaciones largas o inestables al workflow de publicación
4. Guarda el `preflight_run_id` exitoso
5. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
6. Si el lanzamiento llegó a `beta`, usa el workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión stable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma build stable, usa ese mismo workflow privado
   para apuntar ambos dist-tags a la versión stable, o deja que su sincronización
   programada de autorreparación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta de promoción beta primero.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los mantenedores usan la documentación privada de lanzamiento en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
