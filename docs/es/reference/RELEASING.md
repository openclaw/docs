---
read_when:
    - Buscas definiciones de canales de lanzamiento públicos
    - Buscas la nomenclatura de versiones y la cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-23T14:08:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de lanzamientos

OpenClaw tiene tres canales públicos de lanzamiento:

- stable: lanzamientos etiquetados que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: la cabeza móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión estable actual promovida en npm
- `beta` significa el destino de instalación beta actual
- Los lanzamientos estables y las correcciones estables se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest`, o promover más adelante una compilación beta validada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, y la compilación/firma/notarización de la app de macOS se reserva para estable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos pasan primero por beta
- Estable solo sigue después de que se valide la beta más reciente
- Los mantenedores normalmente crean lanzamientos a partir de una rama `release/YYYY.M.D` creada
  desde la `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta ya se ha enviado o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación
  es solo para mantenedores

## Verificaciones previas al lanzamiento

- Ejecuta `pnpm check:test-types` antes de las verificaciones previas al lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la validación local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de las verificaciones previas al lanzamiento para que la comprobación más amplia de
  ciclos de importación y límites de arquitectura esté en verde fuera de la validación local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los
  artefactos de lanzamiento esperados en `dist/*` y el bundle de la interfaz Control para el paso
  de validación del paquete
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la validación de paridad simulada de QA Lab más los canales QA en vivo de
  Matrix y Telegram antes de la aprobación del lanzamiento. Los canales en vivo usan el entorno
  `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI.
- La validación de instalación y actualización en tiempo de ejecución entre distintos sistemas operativos se envía desde el
  flujo de trabajo de invocación privada
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el flujo de trabajo público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantener la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su
  propio carril para no ralentizar ni bloquear la publicación
- Las comprobaciones de lanzamiento deben enviarse desde la referencia del flujo de trabajo `main` o desde una
  referencia de flujo de trabajo `release/YYYY.M.D` para que la lógica del flujo de trabajo y los secretos permanezcan
  controlados
- Ese flujo de trabajo acepta una etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit de la rama del flujo de trabajo
- En modo SHA de commit solo acepta el HEAD actual de la rama del flujo de trabajo; usa una
  etiqueta de lanzamiento para commits de lanzamientos más antiguos
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual
  de 40 caracteres del commit de la rama del flujo de trabajo sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA el flujo de trabajo sintetiza `v<package.json version>` solo para la comprobación de metadatos
  del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de
  Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos del flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa del lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación
  publicada en el registro en un prefijo temporal nuevo
- La automatización de lanzamientos de mantenedores ahora usa verificación previa y luego promoción:
  - la publicación real en npm debe pasar una `preflight_run_id` npm satisfactoria
  - la publicación real en npm debe enviarse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución satisfactoria de verificación previa
  - los lanzamientos estables en npm usan `beta` de forma predeterminada
  - la publicación estable en npm puede apuntar explícitamente a `latest` mediante entrada del flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora está en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` sigue necesitando `NPM_TOKEN` mientras que el
    repositorio público mantiene la publicación solo con OIDC
  - el flujo público `macOS Release` es solo de validación
  - la publicación real privada de mac debe pasar una verificación previa privada de mac
    `preflight_run_id` y `validate_run_id` satisfactorias
  - las rutas de publicación reales promueven artefactos preparados en lugar de volver a compilarlos
- Para lanzamientos de corrección estable como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización de prefijo temporal desde `YYYY.M.D` hasta `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales anteriores en la
  carga estable base
- La verificación previa del lanzamiento npm falla en cerrado a menos que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía `dist/control-ui/assets/`
  para no volver a distribuir un panel del navegador vacío
- La verificación posterior a la publicación también comprueba que la instalación del registro publicada
  contiene dependencias de tiempo de ejecución no vacías de plugins incluidos bajo el diseño raíz `dist/*`.
  Un lanzamiento que se distribuye con cargas faltantes o vacías de dependencias de
  plugins incluidos falla en el verificador posterior a la publicación y no puede promocionarse
  a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del paquete npm sobre
  el tarball candidato de actualización, para que el e2e del instalador detecte el aumento accidental del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo del lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de prueba de extensiones, regenera y revisa las salidas de matriz del flujo de trabajo
  `checks-node-extensions` propiedad del planificador desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas del lanzamiento no describan un diseño de CI desactualizado
- La preparación del lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe mantener un id de bundle no de depuración, una URL no vacía del feed de Sparkle
    y una `CFBundleVersion` igual o superior al umbral canónico de compilación de Sparkle
    para esa versión del lanzamiento

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA completo actual
  de 40 caracteres del commit de la rama del flujo de trabajo para verificación previa solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución satisfactoria de verificación previa
- `npm_dist_tag`: etiqueta de destino npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit de `main`
  que se debe validar cuando se envía desde `main`; desde una rama de lanzamiento, usa una
  etiqueta de lanzamiento existente o el SHA completo actual de 40 caracteres del commit de la rama de lanzamiento

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas beta de prelanzamiento solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA completo de commit solo se permite cuando
  `preflight_only=true`
- `OpenClaw Release Checks` es siempre solo de validación y también acepta el
  SHA del commit actual de la rama del flujo de trabajo
- El modo SHA de commit de comprobaciones de lanzamiento también requiere el HEAD actual de la rama del flujo de trabajo
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la verificación previa;
  el flujo de trabajo verifica que esos metadatos sigan igual antes de continuar con la publicación

## Secuencia estable de lanzamiento npm

Al crear un lanzamiento npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo actual del commit de la rama del flujo de trabajo
     para una ejecución en seco solo de validación del flujo de trabajo de verificación previa
2. Elige `npm_dist_tag=beta` para el flujo normal primero beta, o `latest` solo
   cuando quieras intencionadamente una publicación estable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual de la rama del flujo de trabajo cuando quieras cobertura en vivo de caché de prompts,
   paridad de QA Lab, Matrix y Telegram
   - Esto es independiente a propósito para que la cobertura en vivo siga disponible sin
     volver a acoplar comprobaciones de larga duración o inestables al flujo de trabajo de publicación
4. Guarda el `preflight_run_id` satisfactorio
5. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
6. Si el lanzamiento terminó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado
   para hacer que ambas dist-tags apunten a la versión estable, o deja que su sincronización automática
   programada mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque sigue
requiriendo `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta de promoción primero beta.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los mantenedores usan la documentación privada de lanzamientos en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.
