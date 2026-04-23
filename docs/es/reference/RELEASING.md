---
read_when:
    - Buscar definiciones de canales de lanzamiento públicos
    - Buscar nomenclatura de versiones y cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-23T05:20:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: edb86d97a37e400a4041f1e087c90d9a4f26087cc5da5c37d11f7ca58dba9404
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de lanzamientos

OpenClaw tiene tres canales públicos de lanzamiento:

- stable: lanzamientos etiquetados que publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prerelanzamiento que publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento stable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección stable: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión de prerelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa el lanzamiento stable actual promovido en npm
- `beta` significa el destino de instalación beta actual
- Los lanzamientos stable y las correcciones stable se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar a `latest` explícitamente, o promover más tarde una compilación beta validada
- Cada lanzamiento stable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta de npm/paquete, y la compilación/firma/notarización de la app para mac queda reservada para stable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable sigue solo después de validar la beta más reciente
- Normalmente, los maintainers generan lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir de `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta ya se ha enviado o publicado y necesita una corrección, los maintainers crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para maintainers

## Verificaciones previas al lanzamiento

- Ejecuta `pnpm check:test-types` antes de las verificaciones previas al lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de las verificaciones previas al lanzamiento para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén correctas fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los
  artefactos de lanzamiento esperados `dist/*` y el paquete de UI de control para el paso
  de validación del empaquetado
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual independiente:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la puerta de paridad simulada de QA Lab y el canal
  en vivo de QA de Telegram antes de la aprobación del lanzamiento. El canal en vivo usa el
  entorno `qa-live-shared` y leases de credenciales de Convex CI.
- La validación de instalación y actualización en tiempo de ejecución entre sistemas operativos se despacha desde el
  flujo de trabajo privado invocador
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el flujo de trabajo público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su
  propio canal para que no ralenticen ni bloqueen la publicación
- Las comprobaciones de lanzamiento deben despacharse desde la referencia de flujo de trabajo `main` o desde una
  referencia de flujo de trabajo `release/YYYY.M.D` para que la lógica del flujo de trabajo y los secretos sigan
  controlados
- Ese flujo de trabajo acepta una etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres de la rama del flujo de trabajo
- En modo SHA de commit solo acepta la cabecera actual de la rama del flujo de trabajo; usa una
  etiqueta de lanzamiento para commits de lanzamiento más antiguos
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres de la rama del flujo de trabajo sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la comprobación de metadatos del
  paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en
  runners alojados por GitHub, mientras que la ruta de validación no mutante puede usar
  los runners Linux Blacksmith más grandes
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando tanto los secretos de flujo de trabajo `OPENAI_API_KEY` como `ANTHROPIC_API_KEY`
- La verificación previa del lanzamiento npm ya no espera al canal separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del
  registro publicado en un prefijo temporal nuevo
- La automatización de lanzamiento de maintainer ahora usa verificación previa y luego promoción:
  - la publicación npm real debe pasar un `preflight_run_id` npm exitoso
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución de verificación previa exitosa
  - los lanzamientos npm stable usan `beta` de forma predeterminada
  - la publicación npm stable puede apuntar a `latest` explícitamente mediante entrada de flujo de trabajo
  - la mutación basada en token de dist-tags npm ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras que el
    repositorio público mantiene publicación solo con OIDC
  - la `macOS Release` pública es solo de validación
  - la publicación privada real para mac debe pasar una verificación previa privada exitosa para mac
    `preflight_run_id` y `validate_run_id`
  - las rutas de publicación reales promueven artefactos preparados en lugar de volver a compilarlos
- Para lanzamientos de corrección stable como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la
  carga stable base
- La verificación previa del lanzamiento npm falla de forma cerrada a menos que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía `dist/control-ui/assets/`
  para que no volvamos a distribuir un panel de navegador vacío
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del empaquetado npm sobre el tarball de actualización candidato, para que el e2e del instalador detecte crecimiento accidental del paquete antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz del flujo de trabajo
  `checks-node-extensions` propiedad del planificador desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas del lanzamiento no describan una disposición de CI obsoleta
- La preparación del lanzamiento stable para macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip stable después de la publicación
  - la app empaquetada debe mantener un bundle id no de depuración, una URL de feed de Sparkle no vacía
    y un `CFBundleVersion` igual o superior al umbral canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el
  SHA completo actual de 40 caracteres de la rama del flujo de trabajo para verificación previa solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución de verificación previa exitosa
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; su valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit en `main`
  para validar cuando se despacha desde `main`; desde una rama de lanzamiento, usa una
  etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit de la rama de lanzamiento

Reglas:

- Las etiquetas stable y de corrección pueden publicar en `beta` o `latest`
- Las etiquetas beta de prerelanzamiento pueden publicar solo en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA completo de commit solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` siempre es solo de validación y también acepta el
  SHA del commit actual de la rama del flujo de trabajo
- El modo SHA de commit de comprobaciones de lanzamiento también requiere la cabecera actual de la rama del flujo de trabajo
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la verificación previa;
  el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento npm stable

Al generar un lanzamiento npm stable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo actual del commit de la rama del flujo de trabajo
     para una ejecución de prueba solo de validación del flujo de trabajo de verificación previa
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación stable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual de la rama del flujo de trabajo cuando quieras cobertura en vivo de caché de prompt,
   paridad de QA Lab y Telegram en vivo
   - Esto está separado a propósito para que la cobertura en vivo siga disponible sin
     volver a acoplar comprobaciones de larga duración o inestables al flujo de trabajo de publicación
4. Guarda el `preflight_run_id` exitoso
5. Ejecuta `OpenClaw NPM Release` otra vez con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
6. Si el lanzamiento aterrizó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión stable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación stable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión stable, o deja que su sincronización automática programada
   mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta de promoción beta primero.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los maintainers usan la documentación privada de lanzamiento en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.
