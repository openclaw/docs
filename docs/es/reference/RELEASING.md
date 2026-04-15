---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Buscando la nomenclatura de versiones y la cadencia
summary: Canales de lanzamiento públicos, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-04-15T05:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de lanzamientos

OpenClaw tiene tres canales de lanzamiento públicos:

- stable: lanzamientos etiquetados que publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de prelanzamiento que publican en npm `beta`
- dev: la cabecera móvil de `main`

## Nomenclatura de versiones

- Versión de lanzamiento stable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de lanzamiento de corrección stable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión de prelanzamiento beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No agregues ceros a la izquierda al mes ni al día
- `latest` significa la versión estable actual promovida en npm
- `beta` significa el destino de instalación beta actual
- Los lanzamientos stable y las correcciones stable publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar a `latest` explícitamente, o promover más tarde una compilación beta validada
- Cada lanzamiento de OpenClaw distribuye el paquete npm y la app de macOS al mismo tiempo

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable sigue solo después de que se valida la beta más reciente
- El procedimiento detallado de lanzamiento, las aprobaciones, las credenciales y las notas de recuperación son
  solo para maintainers

## Verificación previa del lanzamiento

- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de lanzamiento `dist/*`
  esperados y el paquete de la Control UI para el paso de validación
  del paquete
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las verificaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- La validación de instalación y actualización en tiempo de ejecución entre sistemas operativos se despacha desde el
  flujo de trabajo invocador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca el flujo de trabajo público reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento en npm corta,
  determinista y centrada en artefactos, mientras que las verificaciones en vivo más lentas permanecen en su
  propio canal para que no ralenticen ni bloqueen la publicación
- Las verificaciones de lanzamiento deben despacharse desde la referencia del flujo de trabajo `main` para que la
  lógica del flujo de trabajo y los secretos permanezcan canónicos
- Ese flujo de trabajo acepta una etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres del commit de `main`
- En el modo de SHA de commit, solo acepta el HEAD actual de `origin/main`; usa una
  etiqueta de lanzamiento para commits de lanzamiento más antiguos
- La verificación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA actual completo de 40 caracteres del commit de `main` sin requerir una etiqueta enviada
- Esa ruta de SHA es solo de validación y no puede promoverse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la
  verificación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux Blacksmith
  más grandes
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando tanto los secretos del flujo de trabajo `OPENAI_API_KEY` como `ANTHROPIC_API_KEY`
- La verificación previa del lanzamiento en npm ya no espera al canal separado de verificaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación
  publicada del registro en un prefijo temporal nuevo
- La automatización de lanzamiento de maintainer ahora usa verificación previa y después promoción:
  - la publicación real en npm debe pasar un `preflight_run_id` exitoso de npm
  - los lanzamientos stable en npm usan `beta` de forma predeterminada
  - la publicación stable en npm puede apuntar a `latest` explícitamente mediante la entrada del flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras que el
    repositorio público mantiene publicación solo con OIDC
  - la `macOS Release` pública es solo de validación
  - la publicación real privada de mac debe pasar los `preflight_run_id` y `validate_run_id`
    privados de mac exitosos
  - las rutas de publicación reales promueven artefactos preparados en lugar de
    volver a compilarlos
- Para lanzamientos de corrección stable como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización de prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas con la carga útil stable base
- La verificación previa del lanzamiento en npm falla de forma segura a menos que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía en `dist/control-ui/assets/`
  para que no volvamos a distribuir un panel del navegador vacío
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` de npm pack sobre
  el tarball candidato de actualización, para que el e2e del instalador detecte un aumento accidental del tamaño del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento modificó la planificación de CI, los manifiestos de temporización de extensiones o
  las matrices de pruebas de extensiones, regenera y revisa las salidas de la matriz del flujo de trabajo
  `checks-node-extensions` gestionadas por el planificador desde `.github/workflows/ci.yml`
  antes de la aprobación, para que las notas del lanzamiento no describan una disposición obsoleta de CI
- La preparación de lanzamientos stable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`
  - `appcast.xml` en `main` debe apuntar al nuevo zip stable después de la publicación
  - la app empaquetada debe conservar un bundle id no de depuración, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al mínimo canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Entradas del flujo de trabajo de npm

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida como `v2026.4.2`, `v2026.4.2-1`, o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el
  SHA actual completo de 40 caracteres del commit de `main` para una verificación previa solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice
  el tarball preparado de la ejecución de verificación previa exitosa
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: etiqueta de lanzamiento existente o el SHA actual completo de 40 caracteres del commit de `main`
  para validar

Reglas:

- Las etiquetas stable y de corrección pueden publicar en `beta` o `latest`
- Las etiquetas beta de prelanzamiento pueden publicar solo en `beta`
- La entrada del SHA completo del commit solo se permite cuando `preflight_only=true`
- El modo de SHA de commit de las verificaciones de lanzamiento también requiere el HEAD actual de `origin/main`
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la verificación previa;
  el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia de lanzamiento stable en npm

Al hacer un lanzamiento stable en npm:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA actual completo de `main` para una
     ejecución de prueba solo de validación del flujo de trabajo de verificación previa
2. Elige `npm_dist_tag=beta` para el flujo normal primero por beta, o `latest` solo
   cuando quieras intencionalmente una publicación stable directa
3. Ejecuta `OpenClaw Release Checks` por separado con la misma etiqueta o el
   SHA actual completo de `main` cuando quieras cobertura en vivo de caché de prompts
   - Esto es independiente a propósito para que la cobertura en vivo siga disponible sin
     volver a acoplar verificaciones largas o inestables al flujo de trabajo de publicación
4. Guarda el `preflight_run_id` exitoso
5. Ejecuta `OpenClaw NPM Release` nuevamente con `preflight_only=false`, la misma
   `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
6. Si el lanzamiento quedó en `beta`, usa el flujo de trabajo privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión stable de `beta` a `latest`
7. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente con la misma compilación stable, usa ese mismo flujo de trabajo privado
   para hacer que ambas dist-tags apunten a la versión stable, o deja que su sincronización automática
   programada mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad porque todavía
requiere `NPM_TOKEN`, mientras que el repositorio público mantiene publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta de promoción primero por beta.

## Referencias públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Los maintainers usan la documentación privada de lanzamiento en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.
