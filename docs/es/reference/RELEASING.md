---
read_when:
    - Buscar definiciones de canales de lanzamiento públicos
    - Buscar nomenclatura de versiones y cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-24T05:47:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c6d904e21f6d4150cf061ae27594bc2364f0927c48388362b16d8bf97491dc
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw tiene tres vías públicas de lanzamiento:

- stable: lanzamientos etiquetados que publican en npm `beta` por defecto, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prerreleases que publican en npm `beta`
- dev: la cabeza móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento estable: `YYYY.M.D`
  - Etiqueta git: `vYYYY.M.D`
- Versión de lanzamiento estable de corrección: `YYYY.M.D-N`
  - Etiqueta git: `vYYYY.M.D-N`
- Versión beta de prerreleases: `YYYY.M.D-beta.N`
  - Etiqueta git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la versión npm estable promocionada actual
- `beta` significa el objetivo de instalación beta actual
- Los lanzamientos estables y las correcciones estables publican en npm `beta` por defecto; los operadores de lanzamiento pueden dirigir explícitamente a `latest`, o promocionar más tarde una compilación beta verificada
- Cada lanzamiento estable de OpenClaw distribuye juntos el paquete npm y la app de macOS;
  los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, y la compilación/firma/notarización de la app mac queda reservada para stable salvo que se solicite explícitamente

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable solo sigue después de que se valide la beta más reciente
- Los mantenedores normalmente generan lanzamientos desde una rama `release/YYYY.M.D` creada
  a partir de la `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el desarrollo nuevo en `main`
- Si una etiqueta beta ya se ha enviado o publicado y necesita una corrección, los mantenedores generan
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la antigua etiqueta beta
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son solo para mantenedores

## Verificaciones previas al lanzamiento

- Ejecuta `pnpm check:test-types` antes de la verificación previa al lanzamiento para que el TypeScript de pruebas
  siga cubierto fuera del filtro local más rápido `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la verificación previa al lanzamiento para que las comprobaciones más amplias de
  ciclos de importación y límites de arquitectura estén en verde fuera del filtro local más rápido
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan
  los artefactos esperados de lanzamiento `dist/*` y el bundle de la interfaz de Control para el paso de
  validación de empaquetado
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el filtro simulado de paridad QA Lab más las vías QA live
  de Matrix y Telegram antes de la aprobación del lanzamiento. Las vías live usan el
  entorno `qa-live-shared`; Telegram también usa concesiones de credenciales CI de Convex.
- La validación de instalación y actualización en tiempo de ejecución entre SO se despacha desde el
  flujo de trabajo privado llamador
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el flujo de trabajo público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su
  propia vía para no bloquear ni ralentizar la publicación
- Las comprobaciones de lanzamiento deben despacharse desde la referencia de flujo de trabajo `main` o desde una
  referencia `release/YYYY.M.D` para que la lógica del flujo de trabajo y los secretos permanezcan
  controlados
- Ese flujo de trabajo acepta una etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres de la rama del flujo de trabajo
- En modo SHA de commit solo acepta el HEAD actual de la rama del flujo de trabajo; usa una
  etiqueta de lanzamiento para commits de lanzamiento más antiguos
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA actual completo de 40 caracteres de la rama del flujo de trabajo sin requerir una etiqueta enviada
- Esa ruta SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA el flujo de trabajo sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners alojados en GitHub, mientras que la ruta de validación no mutante puede usar
  los runners Linux más grandes de Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando tanto los secretos de flujo de trabajo `OPENAI_API_KEY` como `ANTHROPIC_API_KEY`
- La verificación previa del lanzamiento npm ya no espera a la vía separada de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de
  instalación publicada del registro en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N pnpm test:docker:npm-telegram-live`
  para verificar la incorporación de paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado.
- La automatización de lanzamientos del mantenedor ahora usa verificación previa y luego promoción:
  - la publicación real en npm debe superar con éxito un `preflight_run_id` de npm
  - la publicación real en npm debe despacharse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución previa correcta
  - los lanzamientos estables npm usan por defecto `beta`
  - la publicación estable npm puede dirigirse explícitamente a `latest` mediante entrada del flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` aún necesita `NPM_TOKEN` mientras el
    repositorio público mantiene publicación solo con OIDC
  - la `macOS Release` pública es solo de validación
  - la publicación real privada de mac debe superar satisfactoriamente los
    `preflight_run_id` y `validate_run_id` privados de mac
  - las rutas de publicación reales promocionan artefactos preparados en lugar de reconstruirlos otra vez
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización en prefijo temporal desde `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la carga estable base
- La verificación previa del lanzamiento npm falla de forma segura a menos que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía `dist/control-ui/assets/`
  para que no volvamos a distribuir un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que la instalación publicada en el registro
  contenga dependencias de tiempo de ejecución no vacías de Plugins incluidos bajo el
  diseño raíz `dist/*`. Un lanzamiento que se distribuya con cargas faltantes o vacías de dependencias de Plugins incluidos falla en el verificador postpublish y no puede promocionarse
  a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del empaquetado npm al
  tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz propiedad del planificador
  del flujo de trabajo `checks-node-extensions` desde `.github/workflows/ci.yml`
  antes de la aprobación para que las notas de lanzamiento no describan un diseño de CI obsoleto
- La preparación para lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con el `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe mantener un bundle id no debug, una URL no vacía de feed de Sparkle
    y un `CFBundleVersion` igual o superior al mínimo canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA actual completo de 40 caracteres de la rama del flujo de trabajo para verificación previa solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución previa correcta
- `npm_dist_tag`: etiqueta objetivo npm para la ruta de publicación; predeterminada a `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres de `main`
  para validar cuando se despacha desde `main`; desde una rama de lanzamiento, usa una
  etiqueta existente de lanzamiento o el SHA actual completo de 40 caracteres de la rama de lanzamiento

Reglas:

- Las etiquetas estables y de corrección pueden publicar tanto en `beta` como en `latest`
- Las etiquetas beta de prerreleases pueden publicar solo en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA completo de commit solo está permitida cuando
  `preflight_only=true`
- `OpenClaw Release Checks` siempre es solo de validación y también acepta el
  SHA del commit actual de la rama del flujo de trabajo
- El modo SHA de commit de las comprobaciones de lanzamiento también requiere el HEAD actual
  de la rama del flujo de trabajo
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la verificación previa;
  el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento estable npm

Al generar un lanzamiento estable npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA actual completo de la rama del flujo de trabajo
     para una simulación de solo validación del flujo de trabajo previo
2. Elige `npm_dist_tag=beta` para el flujo beta-first normal, o `latest` solo
   cuando quieras intencionadamente una publicación estable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA completo actual de la rama del flujo de trabajo cuando quieras cobertura de caché live de prompt,
   paridad QA Lab, Matrix y Telegram
   - Esto es separado a propósito para que la cobertura live siga disponible sin
     volver a acoplar comprobaciones largas o inestables al flujo de publicación
4. Guarda el `preflight_run_id` correcto
5. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
6. Si el lanzamiento aterrizó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promocionar esa versión estable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta`
   debe seguir de inmediato la misma compilación estable, usa ese mismo flujo de trabajo privado
   para apuntar ambas dist-tags a la versión estable, o deja que su
   sincronización autocurativa programada mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque aún
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta beta-first de promoción.

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

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
