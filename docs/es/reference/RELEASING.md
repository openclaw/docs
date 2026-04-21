---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Buscando nomenclatura de versiones y cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-21T05:18:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de lanzamientos

OpenClaw tiene tres canales públicos de lanzamiento:

- stable: lanzamientos etiquetados que se publican en npm `beta` por defecto, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento estable de corrección: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa el lanzamiento npm estable promovido actual
- `beta` significa el destino actual de instalación beta
- Los lanzamientos estables y las correcciones estables se publican en npm `beta` por defecto; los operadores de lanzamiento pueden apuntar explícitamente a `latest` o promover más adelante una compilación beta validada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, y
  la compilación/firmado/notarización de la app de macOS se reserva para stable salvo solicitud explícita

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable sigue solo después de que se valide la beta más reciente
- Los mantenedores normalmente crean lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir de `main` actual, para que la validación y las correcciones de lanzamiento no bloqueen
  el desarrollo nuevo en `main`
- Si una etiqueta beta ya se ha enviado o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Verificaciones previas al lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa del lanzamiento para que el TypeScript de pruebas
  siga cubierto fuera de la compuerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa del lanzamiento para que las comprobaciones más amplias
  de ciclos de importación y límites de arquitectura estén en verde fuera de la compuerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados
  `dist/*` y el paquete de Control UI existan para el paso
  de validación del pack
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las verificaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual independiente:
  `OpenClaw Release Checks`
- La validación de instalación y actualización en tiempo de ejecución entre distintos sistemas operativos se despacha desde el
  flujo de trabajo de llamada privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el flujo de trabajo público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su
  propio canal para que no ralenticen ni bloqueen la publicación
- Las verificaciones de lanzamiento deben despacharse desde la referencia del flujo de trabajo `main` o desde una
  referencia de flujo de trabajo `release/YYYY.M.D` para que la lógica del flujo y los secretos sigan
  controlados
- Ese flujo de trabajo acepta una etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres del commit de la rama del flujo de trabajo
- En modo SHA de commit solo acepta el HEAD actual de la rama del flujo de trabajo; usa una
  etiqueta de lanzamiento para commits de lanzamiento anteriores
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres del commit de la rama del flujo de trabajo sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA el flujo de trabajo sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners alojados por GitHub, mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos del flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa del lanzamiento npm ya no espera al canal independiente de verificaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación publicada del registro en un prefijo temporal limpio
- La automatización de lanzamiento de mantenedores ahora usa verificación previa y luego promoción:
  - la publicación real en npm debe superar una `preflight_run_id` de npm correcta
  - la publicación real en npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución correcta de verificación previa
  - los lanzamientos npm estables usan `beta` por defecto
  - la publicación npm estable puede apuntar a `latest` explícitamente mediante entrada del flujo de trabajo
  - la mutación de dist-tag npm basada en token ahora reside en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` sigue necesitando `NPM_TOKEN` mientras el
    repositorio público mantiene la publicación solo con OIDC
  - `macOS Release` público es solo de validación
  - la publicación real privada de mac debe superar correctamente la mac privada
    `preflight_run_id` y `validate_run_id`
  - las rutas de publicación reales promueven artefactos ya preparados en lugar de volver a compilarlos
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.D` hasta `YYYY.M.D-N`
  para que las correcciones de lanzamiento no dejen silenciosamente instalaciones globales antiguas en la carga estable base
- La verificación previa del lanzamiento npm falla en modo cerrado a menos que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía de `dist/control-ui/assets/`
  para no volver a distribuir un panel de navegador vacío
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del pack npm al tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del pack antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz del flujo de trabajo
  `checks-node-extensions` propiedad del planificador desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas del lanzamiento no describan una disposición de CI obsoleta
- La preparación de lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe mantener un bundle id no de depuración, una URL no vacía
    de feed Sparkle y un `CFBundleVersion` igual o superior al mínimo de compilación
    canónico de Sparkle para esa versión de lanzamiento

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el
  SHA actual completo de 40 caracteres del commit de la rama del flujo de trabajo para verificación previa solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado desde la ejecución correcta de verificación previa
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres de commit de `main`
  para validar cuando se despacha desde `main`; desde una rama de lanzamiento, usa una
  etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres de commit de la rama de lanzamiento

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas beta de prelanzamiento solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada con SHA completo de commit solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` siempre es solo de validación y también acepta el
  SHA actual del commit de la rama del flujo de trabajo
- El modo SHA de commit de verificaciones de lanzamiento también requiere el HEAD actual de la rama del flujo de trabajo
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la verificación previa;
  el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento npm estable

Al crear un lanzamiento npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo actual del commit de la rama del flujo de trabajo
     para una ejecución en seco solo de validación del flujo de trabajo de verificación previa
2. Elige `npm_dist_tag=beta` para el flujo normal primero-beta, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual de la rama del flujo de trabajo cuando quieras cobertura en vivo de caché de prompt
   - Esto es independiente a propósito para que la cobertura en vivo siga disponible sin
     volver a acoplar comprobaciones largas o inestables al flujo de publicación
4. Guarda la `preflight_run_id` correcta
5. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y la `preflight_run_id` guardada
6. Si el lanzamiento aterrizó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización automática programada
   mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta de promoción primero-beta.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los mantenedores usan la documentación privada de lanzamiento en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para la guía real de ejecución.
