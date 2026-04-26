---
read_when:
    - Buscas definiciones de canales de lanzamiento públicos
    - Buscas nomenclatura de versiones y cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-26T11:37:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw tiene tres canales de lanzamiento públicos:

- stable: lanzamientos etiquetados que publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección estable: `YYYY.M.D-N`
  - Etiqueta Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta Git: `vYYYY.M.D-beta.N`
- No agregues ceros a la izquierda al mes ni al día
- `latest` significa el lanzamiento estable actual promovido en npm
- `beta` significa el destino de instalación beta actual
- Los lanzamientos estables y las correcciones estables publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar a `latest` explícitamente o promover después una compilación beta validada
- Cada lanzamiento estable de OpenClaw distribuye el paquete npm y la app de macOS juntos;
  los lanzamientos beta normalmente validan y publican primero la ruta del paquete/npm, y la compilación/firma/notarización de la app de macOS se reserva para stable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable solo sigue después de que se valide la beta más reciente
- Los mantenedores normalmente crean lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir de `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el
  desarrollo nuevo en `main`
- Si una etiqueta beta ya se envió o publicó y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Verificaciones previas al lanzamiento

- Ejecuta `pnpm check:test-types` antes de las verificaciones previas al lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la validación local más rápida de `pnpm check`
- Ejecuta `pnpm check:architecture` antes de las verificaciones previas al lanzamiento para que la comprobación más amplia de
  ciclos de importación y límites de arquitectura esté en verde fuera de la validación local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados en
  `dist/*` y el bundle de la interfaz de usuario de Control existan para el paso de
  validación del paquete
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría del lanzamiento. Esto ejercita
  QA-lab a través de un receptor OTLP/HTTP local y verifica los nombres de los spans de trazas exportados,
  los atributos acotados y la redacción de contenido/identificadores sin
  requerir Opik, Langfuse ni otro recolector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la compuerta de paridad simulada de QA Lab, además de los canales
  activos de QA para Matrix y Telegram antes de la aprobación del lanzamiento. Los canales activos usan el
  entorno `qa-live-shared`; Telegram también usa leases de credenciales de Convex CI.
- La validación de instalación y actualización en tiempo de ejecución entre sistemas operativos se despacha desde el
  flujo de trabajo llamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el flujo de trabajo público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento a npm corta,
  determinista y enfocada en artefactos, mientras que las comprobaciones activas más lentas permanecen en su
  propio canal para que no ralenticen ni bloqueen la publicación
- Las comprobaciones de lanzamiento deben despacharse desde la referencia de flujo de trabajo `main` o desde una
  referencia de flujo de trabajo `release/YYYY.M.D` para que la lógica del flujo de trabajo y los secretos permanezcan
  controlados
- Ese flujo de trabajo acepta una etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres del commit de la rama del flujo de trabajo
- En modo SHA de commit solo acepta la cabecera actual de la rama del flujo de trabajo; usa una
  etiqueta de lanzamiento para commits de lanzamiento más antiguos
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el
  SHA actual completo de 40 caracteres del commit de la rama del flujo de trabajo sin requerir una etiqueta enviada
- Esa ruta con SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la comprobación de metadatos
  del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de
  Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La verificación previa del lanzamiento npm ya no espera al canal separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación publicada del registro
  en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales de Telegram arrendadas.
  Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamientos para mantenedores ahora usa verificación previa y luego promoción:
  - la publicación real en npm debe superar correctamente un `preflight_run_id` de npm
  - la publicación real en npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución previa correcta
  - los lanzamientos estables de npm usan `beta` de forma predeterminada
  - la publicación estable en npm puede apuntar a `latest` explícitamente mediante una entrada del flujo de trabajo
  - la mutación de dist-tags de npm basada en token ahora reside en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras que el
    repositorio público mantiene la publicación solo con OIDC
  - `macOS Release` público es solo de validación
  - la publicación real privada de mac debe superar correctamente los identificadores de ejecución
    `preflight_run_id` y `validate_run_id` privados de mac
  - las rutas de publicación reales promueven artefactos preparados en lugar de volver a compilarlos
- Para lanzamientos de corrección estables como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización en prefijo temporal desde `YYYY.M.D` hasta `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la carga útil base estable
- La verificación previa del lanzamiento npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía en `dist/control-ui/assets/`
  para que no volvamos a distribuir un panel del navegador vacío
- La verificación posterior a la publicación también comprueba que la instalación publicada del registro
  contenga dependencias de tiempo de ejecución de Plugin incluidas no vacías bajo el diseño raíz `dist/*`.
  Un lanzamiento que distribuya cargas útiles de dependencias de Plugin incluidas faltantes o vacías
  falla en el verificador posterior a la publicación y no puede promoverse
  a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del empaquetado npm sobre
  el tarball candidato de actualización, para que el e2e del instalador detecte aumentos accidentales del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo del lanzamiento tocó la planificación de CI, los manifiestos de tiempos de extensiones o las
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz del flujo de trabajo
  `checks-node-extensions` propiedad del planificador desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas del lanzamiento no describan un diseño de CI obsoleto
- La preparación para un lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación
  - la app empaquetada debe mantener un bundle id no de depuración, una URL de feed de Sparkle no vacía
    y un `CFBundleVersion` igual o superior al límite de compilación canónico de Sparkle
    para esa versión de lanzamiento

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el
  SHA actual completo de 40 caracteres del commit de la rama del flujo de trabajo para una verificación previa solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución previa correcta
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres del commit de `main`
  para validar cuando se despacha desde `main`; desde una rama de lanzamiento, usa una
  etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres del commit de la rama de lanzamiento

Reglas:

- Las etiquetas estables y de corrección pueden publicar en `beta` o en `latest`
- Las etiquetas beta de prelanzamiento solo pueden publicar en `beta`
- Para `OpenClaw NPM Release`, la entrada con SHA completo del commit se permite solo cuando
  `preflight_only=true`
- `OpenClaw Release Checks` siempre es solo de validación y también acepta el
  SHA actual del commit de la rama del flujo de trabajo
- El modo SHA de commit de las comprobaciones de lanzamiento también requiere la cabecera actual de la rama del flujo de trabajo
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la verificación previa;
  el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento estable en npm

Al crear un lanzamiento estable en npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA actual completo del commit de la rama del flujo de trabajo
     para una ejecución en seco solo de validación del flujo de trabajo de verificación previa
2. Elige `npm_dist_tag=beta` para el flujo normal primero-beta, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual del commit de la rama del flujo de trabajo cuando quieras cobertura activa de caché de prompts,
   paridad de QA Lab, Matrix y Telegram
   - Esto es separado a propósito para que la cobertura activa siga disponible sin
     volver a acoplar comprobaciones largas o inestables al flujo de trabajo de publicación
4. Guarda el `preflight_run_id` correcto
5. Ejecuta `OpenClaw NPM Release` otra vez con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
6. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionalmente de forma directa en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su sincronización
   programada de autocorrección mueva `beta` más tarde

La mutación de dist-tags reside en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta de promoción primero-beta.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la
CLI de 1Password (`op`) solo dentro de una sesión dedicada de tmux. No llames a `op`
directamente desde el shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
las alertas y el manejo de OTP sean observables y evita alertas repetidas del host.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los mantenedores usan la documentación privada de lanzamientos en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como guía operativa real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
