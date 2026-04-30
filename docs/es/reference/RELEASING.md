---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de la versión o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-04-30T05:59:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres canales de publicación públicos:

- estable: versiones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de versión preliminar que se publican en npm `beta`
- desarrollo: la cabeza móvil de `main`

## Nomenclatura de versiones

- Versión de publicación estable: `YYYY.M.D`
  - Etiqueta de Git: `vYYYY.M.D`
- Versión de publicación de corrección estable: `YYYY.M.D-N`
  - Etiqueta de Git: `vYYYY.M.D-N`
- Versión preliminar beta: `YYYY.M.D-beta.N`
  - Etiqueta de Git: `vYYYY.M.D-beta.N`
- No rellenes con ceros el mes ni el día
- `latest` significa la publicación estable actual promocionada de npm
- `beta` significa el destino actual de instalación beta
- Las publicaciones estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de publicación pueden apuntar a `latest` explícitamente, o promocionar más adelante una compilación beta revisada
- Cada publicación estable de OpenClaw incluye el paquete npm y la app de macOS juntos;
  las publicaciones beta normalmente validan y publican primero la ruta de npm/paquete, con
  la compilación/firma/notarización de la app para Mac reservada para estable salvo que se solicite explícitamente

## Cadencia de publicación

- Las publicaciones avanzan primero por beta
- La estable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente crean publicaciones desde una rama `release/YYYY.M.D` creada
  a partir de la `main` actual, para que la validación y las correcciones de publicación no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha subido o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta antigua
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son
  solo para mantenedores

## Lista de verificación del operador de publicación

Esta lista de verificación es la forma pública del flujo de publicación. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el runbook de publicación solo para mantenedores.

1. Empieza desde la `main` actual: trae los cambios más recientes, confirma que el commit de destino se haya subido
   y confirma que el CI de la `main` actual esté lo bastante verde como para crear una rama desde ella.
2. Reescribe la sección superior de `CHANGELOG.md` a partir del historial real de commits con
   `/changelog`, mantén las entradas orientadas al usuario, haz commit, súbelo y haz rebase/pull
   una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de publicación en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la compatibilidad vencida
   solo cuando la ruta de actualización siga cubierta, o registra por qué se mantiene
   intencionalmente.
4. Crea `release/YYYY.M.D` desde la `main` actual; no hagas el trabajo normal de publicación
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista y luego ejecuta la
   preflight determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de publicación solo para validación
   preflight. Guarda el `preflight_run_id` correcto.
7. Inicia todas las pruebas previas a la publicación con `Full Release Validation` para la
   rama de publicación, la etiqueta o el SHA completo del commit. Este es el único punto de entrada manual
   para los cuatro grandes entornos de prueba de publicación: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de publicación y vuelve a ejecutar el archivo, lane,
   job de workflow, perfil de paquete, proveedor o allowlist de modelo fallido más pequeño que
   demuestre la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada deje
   obsoleta la evidencia previa.
9. Para beta, etiqueta `vYYYY.M.D-beta.N`, publica con el dist-tag de npm `beta` y luego ejecuta
   la aceptación de paquete posterior a la publicación contra el paquete `openclaw@YYYY.M.D-beta.N`
   o `openclaw@beta` publicado. Si una beta subida o publicada necesita una corrección, crea
   la siguiente `-beta.N`; no elimines ni reescribas la beta antigua.
10. Para estable, continúa solo después de que la beta revisada o la candidata de publicación tenga la
    evidencia de validación requerida. La publicación estable en npm reutiliza el artefacto de
    preflight correcto mediante `preflight_run_id`; la preparación de la publicación estable de macOS
    también requiere los `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el
    `appcast.xml` actualizado en `main`.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E opcional de Telegram
    publicado-npm independiente cuando necesites prueba del canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesaria, las notas de publicación/versión preliminar de GitHub desde la
    sección completa correspondiente de `CHANGELOG.md` y los pasos de anuncio de publicación.

## Preflight de publicación

- Ejecuta `pnpm check:test-types` antes de la comprobación preliminar de lanzamiento para que TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la comprobación preliminar de lanzamiento para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de lanzamiento
  `dist/*` esperados y el paquete de Control UI para el paso de validación
  del paquete
- Ejecuta el flujo de trabajo manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todos los entornos de prueba previos al lanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, lanza manualmente `CI` y lanza
  `OpenClaw Release Checks` para humo de instalación, aceptación de paquetes, suites de ruta de lanzamiento
  Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram.
  Proporciona `npm_telegram_package_spec` solo después de que se haya publicado un paquete
  y también deba ejecutarse el E2E de Telegram posterior a la publicación. Proporciona
  `evidence_package_spec` cuando el informe de evidencia privado deba demostrar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Ejecuta el flujo de trabajo manual `Package Acceptance` cuando quieras prueba de canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS con un
  SHA-256 obligatorio; o `source=artifact` para un tarball subido por otra ejecución de GitHub
  Actions. El flujo de trabajo resuelve el candidato como
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto para paquete/actualización/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta directamente el flujo de trabajo manual `CI` cuando solo necesites cobertura completa de CI normal
  para el candidato de lanzamiento. Los lanzamientos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Linux Node, shards de plugins incluidos, contratos de canal,
  compatibilidad con Node 22, `check`, `check-additional`, humo de compilación,
  comprobaciones de documentación, Skills de Python, Windows, macOS, Android y carriles de i18n de Control UI.
  Ejemplo: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica los nombres de spans
  de trazas exportadas, los atributos delimitados y la redacción de contenido/identificadores sin
  requerir Opik, Langfuse ni otro colector externo.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta la puerta de paridad simulada de QA Lab más el perfil rápido
  de Matrix live y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI.
  Ejecuta el flujo de trabajo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte
  Matrix, medios y E2EE en paralelo.
- La validación de tiempo de ejecución de instalación y actualización entre sistemas operativos forma parte de los
  `OpenClaw Release Checks` públicos y de `Full Release Validation`, que llaman
  directamente al flujo de trabajo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta separación es intencional: mantener la ruta real de lanzamiento de npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su
  propio carril para que no retrasen ni bloqueen la publicación
- Las comprobaciones de lanzamiento que contienen secretos deben lanzarse mediante `Full Release
Validation` o desde la referencia de flujo de trabajo `main`/release para que la lógica del flujo de trabajo y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre que
  el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- La comprobación preliminar solo de validación de `OpenClaw NPM Release` también acepta el SHA completo
  actual de 40 caracteres del commit de la rama del flujo de trabajo sin requerir una etiqueta publicada
- Esa ruta de SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la publicación real y la ruta de promoción en ejecutores hospedados por GitHub,
  mientras que la ruta de validación no mutativa puede usar los ejecutores Linux
  más grandes de Blacksmith
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La comprobación preliminar de lanzamiento npm ya no espera el carril separado de comprobaciones de lanzamiento
- Ejecuta `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado
  en un prefijo temporal nuevo
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar el onboarding de paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el pool compartido de credenciales de Telegram arrendadas.
  Las ejecuciones locales puntuales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de lanzamiento de mantenedores ahora usa comprobación preliminar y luego promoción:
  - la publicación real en npm debe pasar un `preflight_run_id` de npm exitoso
  - la publicación real en npm debe lanzarse desde la misma rama `main` o
    `release/YYYY.M.D` que la ejecución preliminar exitosa
  - los lanzamientos estables de npm usan `beta` por defecto
  - la publicación estable de npm puede apuntar explícitamente a `latest` mediante la entrada del flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por seguridad, porque `npm dist-tag add` aún necesita `NPM_TOKEN` mientras el
    repositorio público mantiene publicación solo con OIDC
  - `macOS Release` público es solo de validación
  - la publicación real privada de mac debe pasar los `preflight_run_id` y
    `validate_run_id` privados de mac exitosos
  - las rutas de publicación reales promocionan artefactos preparados en lugar de volver a compilarlos
- Para lanzamientos estables de corrección como `YYYY.M.D-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.D` a `YYYY.M.D-N`
  para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales más antiguas en la
  carga estable base
- La comprobación preliminar de lanzamiento npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía en `dist/control-ui/assets/`
  para que no volvamos a enviar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que la instalación publicada desde el registro
  contenga dependencias de tiempo de ejecución no vacías para plugins incluidos bajo el diseño raíz
  `dist/*`. Un lanzamiento que se envía con cargas de dependencias de plugins incluidos
  faltantes o vacías falla el verificador postpublish y no puede promocionarse
  a `latest`.
- `pnpm test:install:smoke` también impone el presupuesto `unpackedSize` del empaquetado npm sobre
  el tarball de actualización candidato, de modo que el e2e del instalador detecte un crecimiento accidental del paquete
  antes de la ruta de publicación del lanzamiento
- Si el trabajo de lanzamiento tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no
  describan un diseño de CI obsoleto
- La preparación de un lanzamiento estable de macOS también incluye las superficies del actualizador:
  - el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar
  - la app empaquetada debe mantener un id de paquete no debug, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al piso canónico de compilación de Sparkle
    para esa versión de lanzamiento

## Entornos de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Ejecútalo desde la referencia de flujo de trabajo `main` de confianza y pasa la rama
de lanzamiento, etiqueta o SHA completo de commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

El flujo de trabajo resuelve la referencia objetivo, lanza `CI` manual con
`target_ref=<release-ref>`, lanza `OpenClaw Release Checks` y
opcionalmente lanza E2E de Telegram posterior a la publicación independiente cuando
`npm_telegram_package_spec` está configurado. Luego `OpenClaw Release Checks` distribuye
humo de instalación, comprobaciones de lanzamiento entre sistemas operativos, cobertura live/E2E Docker de ruta de lanzamiento,
Package Acceptance con QA de paquete de Telegram, paridad de QA Lab, Matrix live y
Telegram live. Una ejecución completa solo es aceptable cuando el resumen de `Full Release Validation`
muestra `normal_ci` y `release_checks` como exitosos, y cualquier hijo opcional
`npm_telegram` es exitoso o se omitió intencionalmente. El resumen final del
verificador incluye tablas de trabajos más lentos para cada ejecución hija, de modo que el responsable del lanzamiento
pueda ver la ruta crítica actual sin descargar logs.
Los flujos de trabajo hijos se lanzan desde la referencia de confianza que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando el `ref` objetivo apunta a una
rama o etiqueta de lanzamiento más antigua. No hay una entrada separada de referencia de flujo de trabajo de Full Release Validation;
elige el arnés de confianza eligiendo la referencia de ejecución del flujo de trabajo.

Usa `release_profile` para seleccionar la amplitud live/de proveedores:

- `minimum`: la ruta más rápida de OpenAI/core live y Docker crítica para el lanzamiento
- `stable`: minimum más cobertura estable de proveedores/backend para aprobación de lanzamiento
- `full`: stable más cobertura amplia de proveedores/medios consultiva

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia objetivo
una vez como `release-package-under-test` y reutiliza ese artefacto tanto en
comprobaciones Docker de ruta de lanzamiento como en Package Acceptance. Esto mantiene todos los
entornos orientados a paquetes sobre los mismos bytes y evita compilaciones repetidas de paquetes.
El humo de instalación OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/organización está configurada; de lo contrario, `openai/gpt-5.4-mini`, porque este carril
demuestra instalación del paquete, onboarding, inicio de Gateway y un turno live de agente
en lugar de hacer benchmark del modelo predeterminado más lento. La matriz más amplia de proveedores live
sigue siendo el lugar para cobertura específica de modelos.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No uses la cobertura completa como la primera repetición después de una corrección enfocada. Si falla una caja, usa el flujo de trabajo secundario fallido, el trabajo, la vía de Docker, el perfil de paquete, el proveedor de modelo o la vía de QA para la siguiente prueba. Ejecuta la cobertura completa de nuevo solo cuando la corrección haya cambiado la orquestación compartida de la versión o haya dejado obsoleta la evidencia anterior de todas las cajas. El verificador final de la cobertura vuelve a comprobar los ids registrados de las ejecuciones de los flujos de trabajo secundarios, así que, después de volver a ejecutar correctamente un flujo de trabajo secundario, vuelve a ejecutar solo el trabajo padre `Verify full validation` fallido.

Para una recuperación acotada, pasa `rerun_group` a la cobertura. `all` es la ejecución real del candidato de versión, `ci` ejecuta solo el secundario normal de CI, `plugin-prerelease` ejecuta solo el secundario de plugins exclusivo de la versión, `release-checks` ejecuta cada caja de versión, y los grupos de versión más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram` cuando se proporciona la vía independiente de paquete Telegram.

### Vitest

La caja de Vitest es el flujo de trabajo secundario manual `CI`. La CI manual omite intencionalmente el alcance por cambios y fuerza el grafo de pruebas normal para el candidato de versión: fragmentos de Linux Node, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, prueba rápida de compilación, comprobaciones de docs, Skills de Python, Windows, macOS, Android e i18n de Control UI.

Usa esta caja para responder "¿pasó el árbol de código fuente el conjunto completo normal de pruebas?". No es lo mismo que la validación de producto de la ruta de versión. Evidencia que debes conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` en verde en el SHA objetivo exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando una ejecución necesita análisis de rendimiento

Ejecuta la CI manual directamente solo cuando la versión necesite CI normal determinista, pero no las cajas de Docker, QA Lab, en vivo, entre sistemas operativos o paquetes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La caja de Docker vive en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo de versión. Valida el candidato de versión mediante entornos Docker empaquetados, no solo pruebas a nivel de código fuente.

La cobertura de Docker de versión incluye:

- prueba rápida de instalación completa con la prueba rápida lenta de instalación global de Bun habilitada
- preparación/reutilización de la imagen de prueba rápida del Dockerfile raíz por SHA objetivo, con trabajos de QR, raíz/gateway e instalador/Bun ejecutándose como fragmentos separados de install-smoke
- vías E2E del repositorio
- fragmentos Docker de la ruta de versión: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` y `bundled-channels-contracts`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- vías separadas de dependencias de canales incluidos entre channel-smoke, update-target y fragmentos de contrato de configuración/runtime, en lugar de un único trabajo grande de canales incluidos
- vías separadas de instalación/desinstalación de plugins incluidos `bundled-plugin-install-uninstall-0` hasta `bundled-plugin-install-uninstall-23`
- conjuntos de proveedores live/E2E y cobertura Docker de modelos en vivo cuando las comprobaciones de versión incluyen conjuntos en vivo

Usa los artefactos de Docker antes de volver a ejecutar. El programador de la ruta de versión sube `.artifacts/docker-tests/` con registros de vías, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador y comandos de repetición. Para una recuperación enfocada, usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de volver a ejecutar todos los fragmentos de versión. Los comandos de repetición generados incluyen `package_artifact_run_id` previo y entradas de imagen Docker preparada cuando están disponibles, de modo que una vía fallida pueda reutilizar el mismo tarball y las mismas imágenes de GHCR.

### QA Lab

La caja de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de versión de comportamiento agéntico y a nivel de canal, separada de Vitest y de la mecánica de paquetes Docker.

La cobertura de QA Lab de versión incluye:

- puerta de paridad simulada que compara la vía candidata de OpenAI con la línea base Opus 4.6 usando el paquete de paridad agéntica
- perfil rápido de QA Matrix en vivo usando el entorno `qa-live-shared`
- vía de QA Telegram en vivo usando concesiones de credenciales de Convex CI
- `pnpm qa:otel:smoke` cuando la telemetría de versión necesita prueba local explícita

Usa esta caja para responder "¿se comporta correctamente la versión en escenarios de QA y flujos de canales en vivo?". Conserva las URL de artefactos de las vías de paridad, Matrix y Telegram al aprobar la versión. La cobertura completa de Matrix sigue disponible como una ejecución manual fragmentada de QA-Lab, no como la vía crítica predeterminada de versión.

### Paquete

La caja de paquete es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un candidato en el tarball `package-under-test` consumido por Docker E2E, valida el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene separada la referencia del arnés de flujo de trabajo de la referencia del código fuente del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA de commit completo de `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS con `package_sha256` obligatorio
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` y `telegram_mode=mock-openai`. Los fragmentos Docker de la ruta de versión cubren las vías superpuestas de instalación, actualización y actualización de plugins; Package Acceptance mantiene la compatibilidad de canales incluidos nativa de artefactos, fixtures de plugins sin conexión y QA de paquete Telegram contra el mismo tarball resuelto. Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de versión entre sistemas operativos siguen siendo importantes para el onboarding, el instalador y el comportamiento de plataforma específicos del sistema operativo, pero la validación de producto de paquetes/actualizaciones debe preferir Package Acceptance.

La flexibilidad heredada de package-acceptance está intencionalmente limitada en el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas en npm: entradas privadas de inventario de QA ausentes del tarball, ausencia de `gateway install --wrapper`, archivos de parche ausentes en el fixture git derivado del tarball, ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, ausencia de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir por archivos de marca de metadatos de compilación local que ya se distribuyeron. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes; esas mismas brechas hacen fallar la validación de versión.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de versión sea sobre un paquete realmente instalable:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Perfiles comunes de paquete:

- `smoke`: vías rápidas de instalación de paquete/canal/agente, red de Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/paquete de plugins sin ClawHub en vivo; este es el valor predeterminado de release-check
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
- `full`: fragmentos Docker de la ruta de versión con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba Telegram de candidato de paquete, habilita `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball `package-under-test` resuelto a la vía Telegram; el flujo de trabajo independiente de Telegram todavía acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por operador:

- `tag`: etiqueta de versión obligatoria como `v2026.4.2`, `v2026.4.2-1` o `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA completo de 40 caracteres del commit actual de la rama del flujo de trabajo para preflight solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la ruta real de publicación
- `preflight_run_id`: obligatorio en la ruta real de publicación para que el flujo de trabajo reutilice el tarball preparado de la ejecución preflight correcta
- `npm_dist_tag`: etiqueta objetivo de npm para la ruta de publicación; el valor predeterminado es `beta`

`OpenClaw Release Checks` acepta estas entradas controladas por operador:

- `ref`: rama, etiqueta o SHA completo de commit que se debe validar. Las comprobaciones que contienen secretos requieren que el commit resuelto sea accesible desde una rama de OpenClaw o una etiqueta de versión.

Reglas:

- Las etiquetas estables y de corrección pueden publicarse en `beta` o `latest`
- Las etiquetas de preversión beta solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA completo de commit solo está permitida cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son solo de validación
- La ruta real de publicación debe usar el mismo `npm_dist_tag` usado durante preflight; el flujo de trabajo verifica esos metadatos antes de que continúe la publicación

## Secuencia de versión npm estable

Al preparar una versión npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo actual del commit de la rama del flujo de trabajo para una prueba en seco solo de validación del flujo de trabajo preflight
2. Elige `npm_dist_tag=beta` para el flujo normal beta primero, o `latest` solo cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de versión, la etiqueta de versión o el SHA completo de commit cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram desde un único flujo de trabajo manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta en su lugar el flujo de trabajo manual `CI` en la referencia de versión
5. Guarda el `preflight_run_id` correcto
6. Ejecuta `OpenClaw NPM Release` de nuevo con `preflight_only=false`, el mismo `tag`, el mismo `npm_dist_tag` y el `preflight_run_id` guardado
7. Si la versión aterrizó en `beta`, usa el flujo de trabajo privado `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` para promover esa versión estable de `beta` a `latest`
8. Si la versión se publicó intencionalmente directamente en `latest` y `beta` debe seguir inmediatamente la misma compilación estable, usa ese mismo flujo de trabajo privado para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada de autocorrección mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio privado por seguridad, porque todavía requiere `NPM_TOKEN`, mientras que el repositorio público mantiene la publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta primero documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación npm local, ejecute cualquier comando de la CLI de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llame a `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux hace observables las solicitudes, las alertas y la gestión de OTP, y evita alertas repetidas del host.

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

Los mantenedores usan la documentación privada de lanzamiento en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el manual de ejecución real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
