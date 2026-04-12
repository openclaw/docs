---
read_when:
    - Buscando definiciones públicas de canales de lanzamiento
    - Buscando nomenclatura de versiones y cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-12T23:33:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: dffc1ee5fdbb20bd1bf4b3f817d497fc0d87f70ed6c669d324fea66dc01d0b0b
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de lanzamientos

OpenClaw tiene tres canales públicos de lanzamiento:

- stable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prerelanzamiento que se publican en npm `beta`
- dev: la cabeza móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento estable con corrección: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión beta de prerelanzamiento: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No uses relleno con ceros para el mes ni el día
- `latest` significa el lanzamiento estable actual promovido en npm
- `beta` significa el objetivo de instalación beta actual
- Los lanzamientos estables y las correcciones estables se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más adelante una build beta validada
- Cada lanzamiento de OpenClaw publica conjuntamente el paquete npm y la app de macOS

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable llega solo después de que se valide la beta más reciente
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para maintainers

## Verificaciones previas al lanzamiento

- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los
  artefactos de lanzamiento esperados en `dist/*` y el bundle de la UI de Control para el paso
  de validación del pack
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- Esta separación es intencional: mantener la ruta real de lanzamiento a npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones en vivo más lentas permanecen en su
  propio canal para que no ralenticen ni bloqueen la publicación
- Las comprobaciones de lanzamiento deben lanzarse desde la referencia del workflow `main` para que la
  lógica del workflow y los secretos sigan siendo canónicos
- Ese workflow acepta una etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres de `main`
- En modo SHA de commit solo acepta el HEAD actual de `origin/main`; usa una
  etiqueta de lanzamiento para commits de lanzamiento más antiguos
- La validación previa solo de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres de `main` sin requerir una etiqueta subida
- Esa ruta por SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners alojados por GitHub, mientras que la ruta de validación no mutante puede usar los runners Linux Blacksmith más grandes
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La validación previa de lanzamiento npm ya no espera al canal separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación publicada del registro en un prefijo temporal nuevo
- La automatización de lanzamiento de maintainers ahora usa validación previa y luego promoción:
  - la publicación real en npm debe aprobar una `preflight_run_id` correcta de npm
  - los lanzamientos estables de npm apuntan a `beta` de forma predeterminada
  - la publicación estable de npm puede apuntar explícitamente a `latest` mediante entrada del workflow
  - la promoción estable de npm de `beta` a `latest` sigue disponible como modo manual explícito en el workflow confiable `OpenClaw NPM Release`
  - ese modo de promoción sigue necesitando un `NPM_TOKEN` válido en el entorno `npm-release` porque la gestión de `dist-tag` de npm es independiente de la publicación confiable
  - el `macOS Release` público es solo de validación
  - la publicación privada real de mac debe aprobar una `preflight_run_id` y una `validate_run_id` privadas de mac correctas
  - las rutas de publicación reales promueven artefactos preparados en lugar de reconstruirlos de nuevo
- Para lanzamientos estables con corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización en prefijo temporal desde `YYYY.M.D` hasta `YYYY.M.D-N`
  para que las correcciones de lanzamiento no dejen silenciosamente instalaciones globales antiguas en la
  carga útil estable base
- La validación previa de lanzamiento npm falla de forma estricta salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía en `dist/control-ui/assets/`
  para no volver a enviar un panel del navegador vacío
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos temporales de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz del workflow
  `checks-node-extensions` propiedad del planificador desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas de lanzamiento no describan un diseño de CI obsoleto
- La preparación de un lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe mantener un bundle id no de depuración, una URL de feed Sparkle no vacía
    y un `CFBundleVersion` igual o superior al piso canónico de build Sparkle
    para esa versión de lanzamiento

## Entradas del workflow de npm

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA actual
  completo de 40 caracteres del commit `main` para validación previa solo de validación
- `preflight_only`: `true` para solo validación/build/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el workflow reutilice
  el tarball preparado de la ejecución de validación previa exitosa
- `npm_dist_tag`: etiqueta objetivo de npm para la ruta de publicación; por defecto es `beta`
- `promote_beta_to_latest`: `true` para omitir la publicación y mover una build estable ya publicada en `beta` a `latest`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit `main`
  que se quiere validar

Reglas:

- Las etiquetas estables y de corrección pueden publicarse tanto en `beta` como en `latest`
- Las etiquetas beta de prerelanzamiento solo pueden publicarse en `beta`
- La entrada de SHA de commit completo solo se permite cuando `preflight_only=true`
- El modo de SHA de commit de comprobaciones de lanzamiento también requiere el HEAD actual de `origin/main`
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la validación previa;
  el workflow verifica esos metadatos antes de continuar con la publicación
- El modo de promoción debe usar una etiqueta estable o de corrección, `preflight_only=false`,
  un `preflight_run_id` vacío y `npm_dist_tag=beta`
- El modo de promoción también requiere un `NPM_TOKEN` válido en el entorno `npm-release`
  porque `npm dist-tag add` sigue necesitando autenticación normal de npm

## Secuencia de lanzamiento estable en npm

Al preparar un lanzamiento estable en npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo actual de `main` para una
     ejecución de prueba de solo validación del workflow de validación previa
2. Elige `npm_dist_tag=beta` para el flujo normal beta-first, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual de `main` cuando quieras cobertura en vivo de caché de prompt
   - Esto es separado a propósito para que la cobertura en vivo siga disponible sin
     volver a acoplar comprobaciones largas o inestables al workflow de publicación
4. Guarda la `preflight_run_id` exitosa
5. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, la misma
   `tag`, la misma `npm_dist_tag` y la `preflight_run_id` guardada
6. Si el lanzamiento quedó en `beta`, ejecuta `OpenClaw NPM Release` más adelante con la
   misma `tag` estable, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` vacío y `npm_dist_tag=beta` cuando quieras mover esa
   build publicada a `latest`

El modo de promoción sigue requiriendo la aprobación del entorno `npm-release` y un
`NPM_TOKEN` válido en ese entorno.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa
como la ruta de promoción beta-first.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los maintainers usan la documentación privada de lanzamientos en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.
