---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de lanzamiento o la aceptación de paquetes
    - Buscando la nomenclatura de versiones y la cadencia
summary: Canales de lanzamiento, lista de verificación del operador, cajas de validación, nomenclatura de versiones y cadencia
title: Política de lanzamiento
x-i18n:
    generated_at: "2026-07-05T11:43:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed09e292495a0597fa72d32ad0a17428cf38dcb2d2e11dd77ff60b773a73bf35
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expone actualmente tres canales de actualización orientados al usuario:

- stable: el canal de lanzamiento promocionado existente, que todavía se resuelve mediante npm `latest` hasta que se implemente el hito separado de CLI/canal
- beta: etiquetas de prelanzamiento que se publican en npm `beta`
- dev: la punta móvil de `main`

Por separado, los operadores de lanzamientos pueden publicar el paquete core del
mes completado anterior en npm `extended-stable`, comenzando en el parche `33`.
La línea final regular del mes actual continúa en npm `latest`; esta división
de publicación del lado del operador no cambia por sí sola la resolución de
canales de actualización de la CLI.

Las compilaciones alfa de Tideclaw son una pista de prelanzamiento interna separada (dist-tag de npm `alpha`), cubierta en [entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [cajas de prueba de lanzamiento](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual de lanzamiento npm extended-stable: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta git `vYYYY.M.PATCH`
- Versión diaria/regular final de lanzamiento: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta git `vYYYY.M.PATCH`
- Versión de lanzamiento regular de corrección de fallback: `YYYY.M.PATCH-N`, etiqueta git `vYYYY.M.PATCH-N`
- Versión beta de prelanzamiento: `YYYY.M.PATCH-beta.N`, etiqueta git `vYYYY.M.PATCH-beta.N`
- Versión alfa de prelanzamiento: `YYYY.M.PATCH-alpha.N`, etiqueta git `vYYYY.M.PATCH-alpha.N`
- Nunca rellenes con ceros el mes ni el parche
- `PATCH` es un número secuencial del tren mensual de lanzamientos, no un día calendario. Los lanzamientos regulares finales y beta avanzan el tren actual; las etiquetas solo alfa nunca consumen ni avanzan el número de parche beta/regular, así que ignora las etiquetas heredadas solo alfa con números de parche más altos al seleccionar un tren beta o regular.
- Las compilaciones alfa/nocturnas usan el siguiente tren de parche no lanzado e incrementan solo `alpha.N` para compilaciones repetidas. Una vez que ese parche tiene una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones npm son inmutables: nunca elimines, vuelvas a publicar ni reutilices una etiqueta publicada. Corta el siguiente número de prelanzamiento o el siguiente parche mensual en su lugar.
- `latest` sigue siguiendo la línea npm regular/diaria actual; `beta` es el destino actual de instalación beta
- `extended-stable` significa el paquete npm admitido del mes anterior, comenzando en el parche `33`; el parche `34` y posteriores son lanzamientos de mantenimiento en esa línea mensual
- Los lanzamientos regulares finales y de corrección regular se publican en npm `beta` de forma predeterminada; los operadores de lanzamientos pueden apuntar a `latest` explícitamente, o promocionar una compilación beta validada más tarde
- La ruta mensual dedicada de extended-stable publica solo el paquete core de npm. No publica plugins, artefactos de macOS o Windows, una GitHub Release, dist-tags de repositorios privados, imágenes Docker, artefactos móviles ni descargas del sitio web.
- Cada lanzamiento regular final envía juntos el paquete npm, la app de macOS y los instaladores firmados de Windows Hub. Los lanzamientos beta normalmente validan y publican primero la ruta npm/paquete, con la compilación/firma/notarización/promoción de apps nativas reservada para el lanzamiento regular final, salvo que se solicite explícitamente.

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta; stable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente cortan lanzamientos desde una rama `release/YYYY.M.PATCH` creada desde el `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo desarrollo en `main`
- Si una etiqueta beta ya se ha subido o publicado y necesita una corrección, los mantenedores cortan la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la antigua
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son solo para mantenedores

## Publicación mensual extended-stable solo de npm

Esta es una excepción dedicada al procedimiento regular de lanzamiento que aparece abajo. Para un
mes completado `YYYY.M`, crea `extended-stable/YYYY.M.33`; publica
`vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta
de lanzamiento, la punta de la rama, el checkout, la versión del paquete, la precomprobación de npm
y la ejecución de Full Release Validation deben identificar todos el mismo commit.
El `main` protegido ya debe contener la versión final de un mes calendario estrictamente posterior
por debajo del parche `33`; los parches de mantenimiento siguen siendo elegibles después de que
`main` avance más de un mes.

Ejecuta la precomprobación de npm y Full Release Validation desde la rama exacta
extended-stable, luego guarda ambos ID de ejecución:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` es el perfil existente de profundidad de validación; está
separado del dist-tag npm `extended-stable` y se mantiene intencionalmente
sin cambios.

Después de que ambas ejecuciones tengan éxito y el entorno de lanzamiento npm esté listo, promociona el
tarball exacto de precomprobación. El parche `P` debe ser `33` o mayor:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Para un fork o ensayo no productivo que intencionalmente no pueda satisfacer la
política mensual `.33` o de mes de `main` protegido, agrega
`-f bypass_extended_stable_guard=true` tanto a la precomprobación npm como a los dispatches
de publicación. El valor predeterminado es `false`. El bypass se acepta solo con
`npm_dist_tag=extended-stable` y se registra en el resumen del flujo de trabajo. No
omite la ref canónica de flujo de trabajo `extended-stable/YYYY.M.33`,
la igualdad entre punta de rama/etiqueta/checkout, la sintaxis de etiqueta final, la igualdad
entre versión de paquete/etiqueta, la identidad de ejecución y manifiesto referenciada, la procedencia
del tarball, la aprobación del entorno, la lectura de vuelta del registro ni la evidencia de reparación
del selector.

El flujo de trabajo de publicación verifica las identidades de ejecución referenciadas, el digest del
tarball preparado y ambos selectores del registro npm. Confirma de forma independiente el
resultado después de que el flujo de trabajo tenga éxito:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación tiene éxito pero la lectura de vuelta
del selector falla, no vuelvas a publicar la versión inmutable del paquete. Usa el
único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable`
impreso en el resumen always-run del flujo de trabajo fallido, luego repite ambas
lecturas de vuelta independientes. Revertir al selector anterior es una decisión separada del operador,
no la ruta de reparación de lectura de vuelta.

La lista de verificación regular de abajo sigue siendo responsable de beta, `latest`, GitHub Release,
plugins, macOS, Windows y otras publicaciones de plataforma. No ejecutes esos
pasos para esta ruta extended-stable solo de npm.

## Lista de verificación del operador de lanzamientos regulares

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las credenciales privadas, firma, notarización, recuperación de dist-tags y detalles de rollback de emergencia permanecen en el runbook de lanzamientos solo para mantenedores.

1. Empieza desde el `main` actual: descarga lo último, confirma que el commit objetivo esté subido y confirma que el CI de `main` esté lo suficientemente verde como para crear una rama desde ahí.
2. Genera la sección superior de `CHANGELOG.md` a partir de los PR fusionados y todos los commits directos desde la última etiqueta de lanzamiento alcanzable. Mantén las entradas orientadas al usuario, deduplica entradas solapadas de PR/commit directo, haz commit, sube y vuelve a hacer rebase/pull una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en `src/plugins/compat/registry.ts` y `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la compatibilidad vencida solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva intencionalmente.
4. Crea `release/YYYY.M.PATCH` desde el `main` actual. No hagas trabajo normal de lanzamiento directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta, luego ejecuta `pnpm release:prep`. Refresca en orden las versiones de plugins, shrinkwraps de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales empaquetados, baseline de docs de configuración, exports del SDK de Plugin y baseline de API del SDK de Plugin. Haz commit de cualquier deriva generada antes de etiquetar, luego ejecuta la precomprobación determinista local: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, se permite un SHA completo de 40 caracteres de la rama de lanzamiento para la precomprobación solo de validación. La precomprobación genera evidencia de lanzamiento de dependencias para el grafo exacto de dependencias del checkout y la almacena en el artefacto de precomprobación de npm. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la rama de lanzamiento, etiqueta o SHA completo del commit. Este es el único punto de entrada manual para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package. Guarda el `full_release_validation_run_id`; es una entrada requerida tanto para `OpenClaw NPM Release` como para `OpenClaw Release Publish`.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, lane, job del flujo de trabajo, perfil de paquete, proveedor o lista de permitidos de modelos más pequeño que pruebe la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada vuelva obsoleta la evidencia previa.
9. Para un candidato beta etiquetado, ejecuta `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` desde la rama `release/YYYY.M.PATCH` correspondiente. Para stable, pasa también el lanzamiento fuente requerido de Windows: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. El helper ejecuta las comprobaciones locales de lanzamiento generado, despacha o verifica la evidencia de validación completa de lanzamiento y de precomprobación npm, ejecuta prueba de instalación fresca/actualización de Parallels contra el tarball preparado exacto más prueba del paquete de Telegram, registra planes de npm de plugins y ClawHub, e imprime el comando exacto `OpenClaw Release Publish` solo después de que el paquete de evidencia esté verde.

   `OpenClaw Release Publish` despacha los paquetes de plugins seleccionados o todos los publicables a npm y el mismo conjunto a ClawHub en paralelo, luego promociona el artefacto preparado de precomprobación npm de OpenClaw con el dist-tag correspondiente una vez que la publicación npm de plugins tiene éxito. Después de que el hijo de publicación npm de OpenClaw tenga éxito, crea o actualiza la página correspondiente de GitHub release/prerelease desde la sección completa correspondiente de `CHANGELOG.md`: los lanzamientos stable publicados en npm `latest` se convierten en el último lanzamiento de GitHub, los lanzamientos de mantenimiento stable mantenidos en npm `beta` se crean con GitHub `latest=false`. El flujo de trabajo también sube la evidencia de dependencias de la precomprobación, el manifiesto de validación completa y la evidencia de verificación de registro posterior a la publicación a la GitHub release para respuesta a incidentes posterior al lanzamiento. Imprime los ID de ejecuciones hijas inmediatamente, autoaprueba las puertas del entorno de lanzamiento que el token del flujo de trabajo tiene permitido aprobar, resume los jobs hijos fallidos con colas de logs, cierra la GitHub release y la evidencia de dependencias tan pronto como la publicación npm de OpenClaw tiene éxito, espera a ClawHub siempre que OpenClaw npm se esté publicando, luego ejecuta `pnpm release:verify-beta` y sube evidencia posterior a la publicación para la GitHub release, paquete npm, paquetes npm de plugins seleccionados, paquetes ClawHub seleccionados, ID de ejecuciones hijas del flujo de trabajo e ID opcional de ejecución de NPM Telegram. La ruta de ClawHub reintenta fallos transitorios de instalación de dependencias de la CLI, publica plugins que pasaron preview incluso cuando una celda de preview falla de forma intermitente, y termina con verificación de registro para cada versión de plugin esperada para que las publicaciones parciales permanezcan visibles y se puedan reintentar.

   Luego ejecuta la aceptación del paquete posterior a la publicación contra el paquete publicado `openclaw@YYYY.M.PATCH-beta.N` u `openclaw@beta`. Si un prelanzamiento subido o publicado necesita una corrección, corta el siguiente número de prelanzamiento correspondiente; nunca elimines ni reescribas el antiguo.

10. Para estable, continúa solo después de que la beta o candidata de lanzamiento examinada tenga la evidencia de validación requerida. La publicación estable en npm también pasa por `OpenClaw Release Publish`, reutilizando el artefacto de preflight correcto mediante `preflight_run_id`. La preparación de la versión estable de macOS también requiere los `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`; el flujo de publicación de macOS publica automáticamente el appcast firmado en el `main` público después de verificar los recursos de lanzamiento, o abre/actualiza un PR de appcast si la protección de rama bloquea el envío directo. La preparación estable de Windows Hub requiere los recursos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en el lanzamiento de GitHub de OpenClaw. Pasa la etiqueta de lanzamiento firmada exacta de `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes de instaladores aprobado para la candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de lanzamiento, despacha `Windows Node Release` y verifica los tres recursos antes de la publicación.
11. Después de publicar, ejecuta el verificador posterior a la publicación en npm, el E2E opcional de Telegram con npm publicado independiente cuando necesites prueba de canal posterior a la publicación, la promoción de dist-tag cuando sea necesario, verifica la página de lanzamiento generada en GitHub, ejecuta los pasos de anuncio de lanzamiento y luego completa [Cierre de main estable](#stable-main-closeout) antes de dar por terminado un lanzamiento estable.

## Cierre de main estable

La publicación estable no está completa hasta que `main` contiene el estado real del lanzamiento enviado.

1. Empieza desde el `main` más reciente actualizado. Audita `release/YYYY.M.PATCH` contra él y reenvía los arreglos reales ausentes en `main`. No mezcles a ciegas adaptadores de compatibilidad, pruebas o validación exclusivos del lanzamiento en un `main` más nuevo.
2. Establece `main` en la versión estable enviada, no en un tren siguiente especulativo. Ejecuta `pnpm release:prep` después del cambio de versión raíz y luego `pnpm deps:shrinkwrap:generate`.
3. Haz que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de lanzamiento etiquetada. Incluye la actualización estable de `appcast.xml` cuando el lanzamiento de mac la haya publicado.
4. No agregues `YYYY.M.PATCH+1`, una versión beta ni una sección vacía de changelog futuro a `main` hasta que el operador inicie explícitamente ese tren de lanzamiento.
5. Ejecuta `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envía los cambios y luego verifica que `origin/main` contenga la versión enviada y el changelog antes de dar por completado el lanzamiento estable.
6. Mantén actualizadas las variables de repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` comienza desde el envío a `main` que contiene la versión enviada, el changelog y el appcast después de la publicación estable. Lee evidencia inmutable posterior a la publicación para vincular la etiqueta enviada con sus ejecuciones de Full Release Validation y Publish, luego verifica el estado estable de main, el lanzamiento, la observación estable obligatoria y la evidencia de rendimiento bloqueante. Adjunta un manifiesto de cierre inmutable y una suma de comprobación al lanzamiento de GitHub. El disparador automático por push omite los lanzamientos heredados anteriores a la evidencia inmutable posterior a la publicación y nunca trata esa omisión como un cierre completado.

Un cierre completo requiere tanto recursos como una suma de comprobación coincidente. Un manifiesto parcial reproduce su SHA de `main` registrado y el simulacro de reversión para regenerar bytes idénticos y luego adjunta la suma de comprobación faltante; un par inválido, o una suma de comprobación sin manifiesto, sigue siendo bloqueante. Una ejecución disparada por push sin variables de repositorio del simulacro de reversión se omite sin completar el cierre; un registro de simulacro faltante o con más de 90 días de antigüedad todavía bloquea el cierre manual respaldado por evidencia. Los comandos privados de recuperación permanecen en el runbook exclusivo para mantenedores. Usa el despacho manual solo para reparar o reproducir un cierre estable respaldado por evidencia.

Una etiqueta heredada de corrección de fallback puede reutilizar evidencia de paquete base solo cuando la etiqueta de corrección se resuelve al mismo commit fuente que la etiqueta estable base. Una corrección con una fuente diferente debe publicar y verificar su propia evidencia de paquete.

## Preflight de lanzamiento

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que el TypeScript de pruebas siga cubierto fuera de la puerta local más rápida de `pnpm check`.
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén verdes fuera de la puerta local más rápida.
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados de `dist/*` y el paquete de Control UI existan para el paso de validación de empaquetado.
- Ejecuta `pnpm release:prep` después del aumento de versión raíz y antes de etiquetar. Ejecuta todos los generadores deterministas de lanzamiento que suelen desviarse después de un cambio de versión/configuración/API: versiones de plugins, shrinkwraps de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales empaquetados, línea base de documentación de configuración, exportaciones del SDK de plugins y línea base de API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas guardas en modo comprobación (más una comprobación de presupuesto de superficie del SDK de plugins) e informa todos los fallos de deriva generada en una sola pasada antes de ejecutar las comprobaciones de lanzamiento de paquetes.
- La sincronización de versiones de plugins actualiza de forma predeterminada el paquete de runtime publicable `@openclaw/ai`, las versiones de paquetes de plugins oficiales y los pisos existentes de `openclaw.compat.pluginApi` a la versión de lanzamiento de OpenClaw. Trata ese campo como el piso de API de runtime/SDK de plugins, no solo como una copia de la versión del paquete: para lanzamientos solo de plugins que intencionalmente sigan siendo compatibles con hosts OpenClaw más antiguos, mantén el piso en la API de host más antigua admitida y documenta esa decisión en la prueba de lanzamiento del plugin.
- Ejecuta manualmente el flujo de trabajo `Full Release Validation` antes de la aprobación del lanzamiento para iniciar todos los cuadros de prueba previos al lanzamiento desde un único punto de entrada. Acepta una rama, etiqueta o SHA de commit completo, despacha `CI` manual y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables y completas siempre incluyen observación exhaustiva live/E2E y Docker de la ruta de lanzamiento; `run_release_soak=true` se conserva para una observación beta explícita. Package Acceptance proporciona el E2E canónico de Telegram del paquete durante la validación de candidatas, evitando un segundo sondeador live concurrente.

  Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete npm enviado entre comprobaciones de lanzamiento, Package Acceptance y E2E de Telegram de paquete sin reconstruir el tarball de lanzamiento. Proporciona `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado diferente del resto de la validación de lanzamiento. Proporciona `package_acceptance_package_spec` cuando Package Acceptance deba usar un paquete publicado diferente de la especificación de paquete de lanzamiento. Proporciona `evidence_package_spec` cuando el informe de evidencia de lanzamiento deba probar que la validación coincide con un paquete npm publicado sin forzar Telegram E2E.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Ejecuta manualmente el flujo de trabajo `Package Acceptance` cuando quieras prueba de canal lateral para una candidata de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref` para empaquetar una rama/etiqueta/SHA de `package_ref` de confianza con el arnés actual de `workflow_ref`; `source=url` para un tarball HTTPS público con SHA-256 obligatorio y una política estricta de URL pública; `source=trusted-url` para una política de fuente de confianza nombrada que usa `trusted_source_id` y SHA-256 obligatorios; o `source=artifact` para un tarball subido por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve la candidata a `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese tarball y puede ejecutar QA de Telegram contra el mismo tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete es la candidata y `published_upgrade_survivor_baseline` selecciona la línea base publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como package-under-test, de modo que ejercita la ruta de reinicio gestionado del comando de actualización candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto para paquete/actualización/reinicio/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de la ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada

- Ejecuta manualmente el flujo de trabajo `CI` directamente cuando solo necesites cobertura normal determinista de CI para la candidata de lanzamiento. Los despachos manuales de CI omiten el acotamiento por cambios y fuerzan los shards de Linux Node, shards de plugins empaquetados, shards de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos construidos, comprobaciones de documentación, Skills de Python, Windows, macOS y carriles de i18n de Control UI. Las ejecuciones manuales independientes de CI ejecutan Android solo cuando se despachan con `include_android=true`; `Full Release Validation` pasa esa entrada para su hijo de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de la versión. Ejecuta QA-lab a través de un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, además de atributos de traza acotados y la redacción de contenido/identificadores sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecuta `pnpm qa:otel:collector-smoke` al validar la compatibilidad con recopiladores. Enruta la misma exportación OTLP de QA-lab a través de un contenedor Docker real de OpenTelemetry Collector antes de las aserciones del receptor local.
- Ejecuta `pnpm qa:prometheus:smoke` al validar el scraping protegido de Prometheus. Ejecuta QA-lab, rechaza scrapes no autenticados y verifica que las familias de métricas críticas para la versión permanezcan libres de contenido de prompts, identificadores sin procesar, tokens de autenticación y rutas locales.
- Ejecuta `pnpm qa:observability:smoke` para las rutas de smoke de OpenTelemetry y Prometheus del checkout de código fuente, una tras otra.
- Ejecuta `pnpm release:check` antes de cada versión etiquetada.
- La comprobación previa de `OpenClaw NPM Release` genera evidencia de publicación de dependencias antes de empaquetar el tarball de npm. La barrera de vulnerabilidades de avisos de npm bloquea la publicación. El riesgo de manifiesto transitivo, la superficie de propiedad/instalación de dependencias y los informes de cambios de dependencias son solo evidencia de publicación. El informe de cambios de dependencias compara el candidato de versión con la etiqueta de versión alcanzable anterior. La comprobación previa sube la evidencia de dependencias como `openclaw-release-dependency-evidence-<tag>` y también la incrusta bajo `dependency-evidence/` dentro del artefacto preparado de comprobación previa de npm. La ruta de publicación real reutiliza ese artefacto de comprobación previa y luego adjunta la misma evidencia a la versión de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que exista la etiqueta. Dispárala desde `release/YYYY.M.PATCH` (o `main` al publicar una etiqueta alcanzable desde main), pasa la etiqueta de versión, el `preflight_run_id` correcto de npm de OpenClaw y el `full_release_validation_run_id` correcto, y conserva el alcance predeterminado de publicación de plugins `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El workflow serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw para que el paquete central no se publique antes que sus plugins externalizados.
- La versión estable de `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista la versión no preliminar correspondiente de `openclaw/openclaw-windows-node`, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de despachar cualquier hijo de publicación, verifica que esa versión fuente esté publicada, no sea preliminar, contenga los instaladores x64/ARM64 requeridos y siga coincidiendo con ese mapa aprobado. Luego despacha `Windows Node Release` mientras la versión de OpenClaw aún es un borrador, llevando sin cambios el mapa fijado de digest de instaladores. El workflow hijo descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los compara con los digest fijados, verifica en un runner de Windows que sus firmas Authenticode usen el firmante esperado de OpenClaw Foundation, escribe un manifiesto SHA-256 y sube los instaladores junto con el manifiesto a la versión canónica de GitHub de OpenClaw; después vuelve a descargar los assets promovidos y verifica la pertenencia al manifiesto y los hashes. El padre verifica el contrato actual de assets x64, ARM64 y checksum antes de la publicación. La recuperación directa rechaza nombres de asset `OpenClawCompanion-*` inesperados antes de reemplazar los assets esperados del contrato con los bytes fuente fijados.

  Despacha manualmente `Windows Node Release` solo para recuperación, y pasa siempre una etiqueta exacta, nunca `latest`, junto con el mapa JSON explícito `expected_installer_digests` de la versión fuente aprobada. Los enlaces de descarga del sitio web deben apuntar a URLs exactas de assets de versión de OpenClaw para la versión estable actual, o a `releases/latest/download/...` solo después de verificar que la redirección latest de GitHub apunte a esa misma versión; no enlaces solo a la página de versiones del repositorio complementario.

- Las comprobaciones de versión ahora se ejecutan en un workflow manual separado: `OpenClaw Release Checks`. También ejecuta la ruta de paridad simulada de QA Lab junto con el perfil rápido de Matrix en vivo y la ruta de QA de Telegram antes de la aprobación de la versión. Las rutas en vivo usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI. Ejecuta el workflow manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte Matrix, medios y E2EE en paralelo.
- La validación de runtime de instalación y actualización en varios sistemas operativos forma parte de los workflows públicos `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al workflow reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantener la ruta real de publicación npm corta, determinista y centrada en artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su propia ruta para no demorar ni bloquear la publicación.
- Las comprobaciones de versión que portan secretos deben despacharse mediante `Full Release Validation` o desde la referencia de workflow `main`/release para que la lógica del workflow y los secretos permanezcan controlados.
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre que el commit resuelto sea alcanzable desde una rama o etiqueta de versión de OpenClaw.
- La comprobación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres del commit de la rama del workflow sin requerir una etiqueta enviada. Esa ruta por SHA es solo de validación y no puede promoverse a una publicación real. En modo SHA, el workflow sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real aún requiere una etiqueta de versión real.
- Ambos workflows mantienen la ruta real de publicación y promoción en runners hospedados por GitHub, mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de Blacksmith.
- Ese workflow ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación previa de versión npm ya no espera a la ruta separada de comprobaciones de versión.
- Antes de etiquetar localmente un candidato de versión, ejecuta `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El helper ejecuta las barreras rápidas de publicación, las comprobaciones de publicación npm/ClawHub de plugins, la build, la build de UI y `release:openclaw:npm:check` en el orden que detecta errores comunes que bloquean la aprobación antes de que comience el workflow de publicación de GitHub.
- Ejecuta `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta preliminar/de corrección correspondiente) antes de la aprobación.
- Después de la publicación npm, ejecuta `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/de corrección correspondiente) para verificar la ruta de instalación del registro publicado en un prefijo temporal nuevo.
- Después de publicar una beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar el onboarding del paquete instalado, la configuración de Telegram y el E2E real de Telegram contra el paquete npm publicado usando el conjunto compartido de credenciales arrendadas de Telegram. Los casos puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta la validación de actualización npm/fresh-target de Parallels, despacha `NPM Telegram Beta E2E`, consulta el workflow exacto, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta en cada merge.
- La automatización de versiones para mantenedores usa comprobación previa y luego promoción:
  - La publicación npm real debe pasar un `preflight_run_id` de npm correcto.
  - La publicación real debe despacharse desde la misma rama `main` o `release/YYYY.M.PATCH` que la ejecución correcta de comprobación previa (se permite una rama alfa de Tideclaw para versiones preliminares alfa).
  - Las versiones npm estables tienen `beta` como valor predeterminado; la publicación npm estable puede apuntar explícitamente a `latest` mediante la entrada del workflow.
  - La mutación de dist-tag de npm basada en token vive en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio fuente conserva publicación solo con OIDC.
  - `macOS Release` público es solo de validación; cuando una etiqueta existe solo en una rama de publicación pero el workflow se despacha desde `main`, define `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real de macOS debe pasar un `preflight_run_id` de macOS correcto y un `validate_run_id` correcto.
  - Las rutas de publicación reales promueven artefactos preparados en lugar de reconstruirlos otra vez.
- Para versiones estables de corrección como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` a `YYYY.M.PATCH-N`, para que las correcciones de versión no puedan dejar silenciosamente instalaciones globales antiguas en el payload estable base.
- La comprobación previa de versión npm falla en modo cerrado salvo que el tarball incluya tanto `dist/control-ui/index.html` como un payload no vacío en `dist/control-ui/assets/`, para no volver a enviar un dashboard de navegador vacío.
- La verificación posterior a la publicación también comprueba que los entrypoints de plugins publicados y los metadatos de paquete estén presentes en el layout instalado desde el registro. Una versión que se envía sin payloads de runtime de plugins falla el verificador posterior a la publicación y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del paquete npm en el tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del paquete antes de la ruta de publicación de la versión.
- Si el trabajo de versión tocó la planificación de CI, los manifiestos de tiempos de plugins o las matrices de pruebas de plugins, regenera y revisa las salidas de matriz `plugin-prerelease-extension-shard` propiedad del planificador desde `.github/workflows/plugin-prerelease.yml` antes de la aprobación, para que las notas de versión no describan un layout de CI obsoleto.
- La preparación de una versión estable de macOS también incluye las superficies del actualizador: la versión de GitHub debe terminar con los paquetes `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar (el workflow de publicación de macOS lo confirma automáticamente, o abre un PR de appcast cuando el push directo está bloqueado); la app empaquetada debe conservar un bundle id no de depuración, una URL de feed de Sparkle no vacía y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle para esa versión.

## Cajas de prueba de versión

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas a la versión desde un único punto de entrada. Para una prueba de commit fijado en una rama que avanza rápido, usa el helper para que cada workflow hijo se ejecute desde una rama temporal fijada al SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper envía `release-ci/<sha>-...`, despacha `Full Release Validation` desde esa rama con `ref=<sha>`, verifica que cada `headSha` de workflow hijo coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una ejecución hija de un `main` más nuevo.

Para validación de rama o etiqueta de versión, ejecútala desde la referencia confiable de workflow `main` y pasa la rama o etiqueta de versión como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

El flujo de trabajo resuelve la referencia de destino, despacha `CI` manual con `target_ref=<release-ref>` y luego despacha `OpenClaw Release Checks`. `OpenClaw Release Checks` despliega en paralelo la prueba básica de instalación, las comprobaciones de lanzamiento entre sistemas operativos, la cobertura live/E2E de la ruta de lanzamiento de Docker cuando soak está habilitado, Package Acceptance con el E2E canónico del paquete de Telegram, paridad de QA Lab, Matrix live y Telegram live. Una ejecución completa/all solo es aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como correctos, salvo que una repetición enfocada haya omitido intencionalmente el hijo separado `Plugin Prerelease`. Usa el hijo independiente `npm-telegram` solo para una repetición enfocada de paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen final del verificador incluye tablas de trabajos más lentos para cada ejecución hija, para que el responsable del lanzamiento pueda ver la ruta crítica actual sin descargar registros.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la matriz de etapas completa, los nombres exactos de trabajos del flujo de trabajo, las diferencias entre perfiles stable y full, los artefactos y los identificadores de repetición enfocada.

Los flujos de trabajo hijos se despachan desde la referencia confiable que ejecuta `Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una rama o etiqueta de lanzamiento anterior. No hay una entrada separada de referencia de flujo de trabajo para Full Release Validation; elige el arnés confiable eligiendo la referencia de ejecución del flujo de trabajo. No uses `--ref main -f ref=<sha>` para prueba de commit exacto sobre una `main` móvil; los SHA de commit sin procesar no pueden ser referencias de despacho de flujo de trabajo, así que usa `pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: ruta OpenAI/core live y Docker crítica para el lanzamiento más rápida
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de lanzamiento
- `full`: stable más cobertura amplia consultiva de proveedor/medios

La validación stable y full siempre ejecuta el barrido exhaustivo live/E2E, de ruta de lanzamiento de Docker y acotado de supervivencia a actualizaciones publicadas antes de la promoción. Usa `run_release_soak=true` para solicitar ese mismo barrido para una beta. Ese barrido cubre los cuatro paquetes stable más recientes, además de las bases fijadas `2026.4.23` y `2026.5.2` más cobertura antigua de `2026.4.15`, con bases duplicadas eliminadas y cada base fragmentada en su propio trabajo de ejecutor Docker.

`OpenClaw Release Checks` usa la referencia confiable del flujo de trabajo para resolver la referencia de destino una vez como `release-package-under-test` y reutiliza ese artefacto en comprobaciones entre sistemas operativos, Package Acceptance y Docker de ruta de lanzamiento cuando se ejecuta soak. Esto mantiene todas las cajas orientadas a paquetes en los mismos bytes y evita compilaciones repetidas de paquetes. Después de que una beta ya esté en npm, define `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones de lanzamiento descarguen el paquete publicado una vez, extraigan su SHA de fuente de compilación desde `dist/build-info.json` y reutilicen ese artefacto para las líneas entre sistemas operativos, Package Acceptance, Docker de ruta de lanzamiento y Telegram de paquete.

La prueba básica de instalación OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la variable del repositorio/organización está definida; de lo contrario usa `openai/gpt-5.5`, porque esta línea prueba la instalación del paquete, el onboarding, el arranque del Gateway y un turno de agente live, no compara el modelo predeterminado más lento. La matriz live más amplia de proveedores sigue siendo el lugar para cobertura específica de modelos.

Usa estas variantes según la etapa del lanzamiento:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No uses el paraguas completo como primera repetición después de una corrección enfocada. Si falla una caja, usa el flujo de trabajo hijo, trabajo, línea de Docker, perfil de paquete, proveedor de modelo o línea de QA que falló para la siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando la corrección haya cambiado la orquestación compartida de lanzamiento o haya vuelto obsoleta la evidencia anterior de todas las cajas. El verificador final del paraguas vuelve a comprobar los ids registrados de ejecución de flujos de trabajo hijos, así que después de que un flujo de trabajo hijo se repita correctamente, vuelve a ejecutar solo el trabajo padre `Verify full validation` fallido.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real del candidato de lanzamiento, `ci` ejecuta solo el hijo normal de CI, `plugin-prerelease` ejecuta solo el hijo de Plugin exclusivo de lanzamiento, `release-checks` ejecuta todas las cajas de lanzamiento, y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones enfocadas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones full/all usan el E2E canónico del paquete de Telegram dentro de Package Acceptance. Las repeticiones enfocadas entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo/suite. Los fallos de QA en comprobaciones de lanzamiento bloquean la validación normal del lanzamiento, incluida la deriva dinámica obligatoria de herramientas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw todavía pueden tratar las líneas de comprobación de lanzamiento que no son de seguridad de paquete como consultivas. Cuando `live_suite_filter` solicita explícitamente una línea live de QA con compuerta como Discord, WhatsApp o Slack, la variable correspondiente del repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` debe estar habilitada; de lo contrario, la captura de entrada falla en vez de omitir la línea silenciosamente.

### Vitest

La caja de Vitest es el flujo de trabajo hijo manual `CI`. CI manual omite intencionalmente el alcance por cambios y fuerza el grafo normal de pruebas para el candidato de lanzamiento: fragmentos de Linux Node, fragmentos de Plugin incluido, fragmentos de contrato de Plugin y canal, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones básicas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de Control UI. Android se incluye cuando `Full Release Validation` ejecuta la caja porque el paraguas pasa `include_android=true`; CI manual independiente requiere `include_android=true` para cobertura de Android.

Usa esta caja para responder "¿el árbol de fuentes pasó la suite completa normal de pruebas?". No es lo mismo que la validación de producto por ruta de lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` en verde sobre el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesite CI normal determinista pero no las cajas de Docker, QA Lab, live, entre sistemas operativos o paquetes. Usa el primer comando para CI directa sin Android. Añade `include_android=true` cuando la CI directa de candidato de lanzamiento deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La caja de Docker vive en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo lanzamiento. Valida el candidato de lanzamiento mediante entornos Docker empaquetados en vez de solo pruebas a nivel de fuente.

La cobertura Docker de lanzamiento incluye:

- prueba básica completa de instalación con la prueba básica lenta de instalación global de Bun habilitada
- preparación/reutilización de imagen básica del Dockerfile raíz por SHA de destino, con trabajos básicos QR, root/gateway e instalador/Bun ejecutándose como fragmentos separados de install-smoke
- líneas E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hasta `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- líneas divididas de instalación/desinstalación de Plugin incluido `bundled-plugin-install-uninstall-0` hasta `bundled-plugin-install-uninstall-23`
- suites live/E2E de proveedores y cobertura de modelos live Docker cuando las comprobaciones de lanzamiento incluyen suites live

Usa los artefactos de Docker antes de repetir la ejecución. El planificador de ruta de lanzamiento sube `.artifacts/docker-tests/` con registros de líneas, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del planificador y comandos de repetición. Para recuperación enfocada, usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de volver a ejecutar todos los fragmentos de lanzamiento. Los comandos generados de repetición incluyen `package_artifact_run_id` previo y entradas de imágenes Docker preparadas cuando están disponibles, de modo que una línea fallida pueda reutilizar el mismo tarball y las imágenes de GHCR.

### QA Lab

La caja de QA Lab también forma parte de `OpenClaw Release Checks`. Es la compuerta de lanzamiento de comportamiento agentic y a nivel de canal, separada de Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab de lanzamiento incluye:

- línea de paridad mock que compara la línea candidata OpenAI con la base `anthropic/claude-opus-4-8` usando el paquete de paridad agentic
- perfil rápido de QA Matrix live usando el entorno `qa-live-shared`
- línea de QA Telegram live usando concesiones de credenciales de CI de Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta caja para responder "¿el lanzamiento se comporta correctamente en escenarios de QA y flujos de canal live?". Conserva las URL de artefactos para las líneas de paridad, Matrix y Telegram al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como ejecución manual fragmentada de QA-Lab, en lugar de ser la línea crítica predeterminada para el lanzamiento.

### Paquete

La caja de Package es la compuerta del producto instalable. Está respaldada por `Package Acceptance` y el resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un candidato en el tarball `package-under-test` consumido por Docker E2E, valida el inventario del paquete, registra la versión del paquete y SHA-256, y mantiene separada la referencia del arnés de flujo de trabajo de la referencia de fuente del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de commit completo `package_ref` confiable con el arnés `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS público con `package_sha256` obligatorio; se rechazan credenciales de URL, puertos HTTPS no predeterminados, nombres de host o direcciones resueltas privadas/internas/de uso especial y redirecciones inseguras
- `source=trusted-url`: descargar un `.tgz` HTTPS con `package_sha256` obligatorio y `trusted_source_id` desde una política nombrada en `.github/package-trusted-sources.json`; usa esto para mirrors empresariales propiedad de mantenedores o repositorios de paquetes privados en lugar de añadir una omisión de red privada a nivel de entrada a `source=url`
- `source=artifact`: reutilizar un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Aceptación de paquetes con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Aceptación de paquetes mantiene la migración, la actualización, la actualización de VPS administrado como root, el reinicio de actualización con autenticación configurada, la instalación de Skills de ClawHub en vivo, la limpieza de dependencias obsoletas de plugins, los fixtures de plugins sin conexión, la actualización de plugins, el refuerzo del escape de vinculación de comandos de plugins y el QA de paquetes de Telegram contra el mismo tarball resuelto. Las comprobaciones de lanzamiento bloqueantes usan la línea base predeterminada del último paquete publicado; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el barrido published-upgrade-survivor a `last-stable-4` más las líneas base fijadas `2026.4.23`, `2026.5.2` y `2026.4.15` con escenarios `reported-issues`. Usa Aceptación de paquetes con `source=npm` para un candidato ya publicado, `source=ref` para un tarball npm local respaldado por SHA antes de publicar, `source=trusted-url` para un espejo empresarial/privado propiedad de mantenedores, o `source=artifact` para un tarball preparado subido por otra ejecución de GitHub Actions.

Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen siendo importantes para el onboarding, el instalador y el comportamiento de plataforma específicos del sistema operativo, pero la validación del producto de paquetes/actualizaciones debe preferir Aceptación de paquetes.

La lista de comprobación canónica para la validación de actualizaciones y plugins es [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al decidir qué carril local, Docker, Aceptación de paquetes o comprobación de lanzamiento demuestra un cambio de instalación/actualización de plugin, limpieza de doctor o migración de paquete publicado. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual `Update Migration` independiente, no parte de Full Release CI.

La tolerancia heredada de aceptación de paquetes está intencionalmente limitada en el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para brechas de metadatos ya publicadas en npm: entradas privadas de inventario de QA ausentes del tarball, falta de `gateway install --wrapper`, falta de archivos de parche en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir sobre archivos locales de sello de metadatos de compilación que ya se publicaron. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes; esas mismas brechas fallan la validación de lanzamiento.

Usa perfiles más amplios de Aceptación de paquetes cuando la pregunta de lanzamiento trate sobre un paquete instalable real:

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

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red de Gateway y recarga de configuración
- `package`: contratos de paquete para instalación/actualización/reinicio/plugin más prueba de instalación de Skills de ClawHub en vivo; este es el valor predeterminado de la comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para reejecuciones enfocadas

Para la prueba de Telegram de candidato de paquete, habilita `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Aceptación de paquetes. El flujo de trabajo pasa el tarball resuelto `package-under-test` al carril de Telegram; el flujo de trabajo independiente de Telegram aún acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamientos regulares

Para beta, `latest`, plugins, GitHub Release y publicación de plataforma,
`OpenClaw Release Publish` es el punto de entrada mutante normal. La ruta
mensual `.33+` de extended-stable solo para npm no usa este orquestador. El
flujo de trabajo regular orquesta los flujos de trabajo de publicador de confianza en el orden que
necesita el lanzamiento:

1. Extrae la etiqueta de lanzamiento y resuelve su SHA de commit.
2. Verifica que la etiqueta sea alcanzable desde `main` o `release/*` (o una rama alfa de Tideclaw para prelanzamientos alfa).
3. Ejecuta `pnpm plugins:sync:check`.
4. Despacha `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Despacha `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despacha `OpenClaw NPM Release` con la etiqueta de lanzamiento, la dist-tag de npm y el `preflight_run_id` guardado después de verificar el `full_release_validation_run_id` guardado.
7. Para lanzamientos estables, crea o actualiza el lanzamiento de GitHub como borrador, despacha `Windows Node Release` con el `windows_node_tag` explícito y los `windows_node_installer_digests` aprobados para el candidato, y verifica los activos canónicos del instalador/suma de comprobación antes de publicar el borrador.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publicación estable a la dist-tag beta predeterminada:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

La promoción estable directamente a `latest` es explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Usa los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release` solo para trabajos enfocados de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true` para que el paquete central no pueda publicarse sin cada plugin oficial publicable, incluido `@openclaw/diffs-language-pack`. Para una reparación de plugin seleccionado, establece `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despacha directamente el flujo de trabajo hijo.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por operador:

- `tag`: etiqueta de lanzamiento requerida, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA de commit completo actual de 40 caracteres de la rama del flujo de trabajo para una comprobación preliminar solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false` para la ruta de publicación real
- `preflight_run_id`: id de ejecución preliminar existente y correcto, requerido en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de reconstruirlo
- `full_release_validation_run_id`: id de ejecución correcto de `Full Release Validation` para esta etiqueta/SHA, requerido para la publicación real. Las publicaciones beta pueden continuar solo con la comprobación preliminar con una advertencia, pero la promoción estable/`latest` aún la requiere.
- `release_publish_run_id`: id de ejecución aprobado de `OpenClaw Release Publish`; requerido cuando este flujo de trabajo es despachado por ese padre (llamadas de publicación real de actor bot)
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y el valor predeterminado es `beta`. El parche final `33` y posteriores deben usar `extended-stable`; de forma predeterminada, `extended-stable` rechaza parches anteriores, y siempre rechaza etiquetas no finales.
- `bypass_extended_stable_guard`: booleano solo para pruebas, valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la elegibilidad mensual de extended-stable mientras conserva las comprobaciones de identidad de lanzamiento, artefacto, aprobación y lectura posterior.

`OpenClaw Release Publish` acepta estas entradas controladas por operador:

- `tag`: etiqueta de lanzamiento requerida; ya debe existir
- `preflight_run_id`: id de ejecución preliminar correcta de `OpenClaw NPM Release`; requerido cuando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id de ejecución correcta de `Full Release Validation`; requerido cuando `publish_openclaw_npm=true`
- `windows_node_tag`: etiqueta exacta de lanzamiento no preliminar de `openclaw/openclaw-windows-node`; requerida para la publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato de los nombres actuales de instaladores de Windows a sus resúmenes `sha256:` fijados; requerido para la publicación estable de OpenClaw
- `npm_telegram_run_id`: id opcional de ejecución correcta de `NPM Telegram Beta E2E` para incluir en la evidencia final del lanzamiento
- `npm_dist_tag`: etiqueta npm de destino para el paquete OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa `selected` solo para trabajos enfocados de reparación solo de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establece `false` solo al usar el flujo de trabajo como orquestador de reparación solo de plugins
- `release_profile`: perfil de cobertura de lanzamiento usado para resúmenes de evidencia de lanzamiento; el valor predeterminado es `from-validation`, que lo lee del manifiesto de validación, o se puede sobrescribir con `beta`, `stable` o `full`
- `wait_for_clawhub`: el valor predeterminado es `false` para que la disponibilidad de npm no quede bloqueada por el sidecar de ClawHub; establece `true` solo cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones que usan secretos requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento.
- `run_release_soak`: opta por una prueba de remojo exhaustiva en vivo/E2E, ruta de lanzamiento de Docker y upgrade-survivor desde todos los paquetes anteriores para comprobaciones de lanzamiento beta. `release_profile=stable` y `release_profile=full` la fuerzan.

Reglas:

- Las versiones finales regulares y de corrección por debajo del parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales en el parche `33` o superior deben publicarse en `extended-stable`, y las versiones con sufijo de corrección en ese límite se rechazan.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la comprobación preliminar; el flujo de trabajo verifica que los metadatos antes de publicar sigan coincidiendo

## Secuencia regular de lanzamiento beta/latest estable

Esta secuencia heredada es para el lanzamiento orquestado regular que también posee plugins, GitHub Release, Windows y otros trabajos de plataforma. No es la ruta mensual `.33+` de extended-stable solo para npm documentada en la parte superior de esta página.

Al preparar un lanzamiento estable orquestado regular:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, puedes usar el SHA completo del commit actual de la rama del workflow para una ejecución de prueba solo de validación del workflow de preflight.
2. Elige `npm_dist_tag=beta` para el flujo normal que empieza por beta, o `latest` solo cuando quieras intencionadamente una publicación estable directa.
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA completo del commit cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram desde un solo workflow manual. Si intencionadamente solo necesitas el grafo de pruebas normal determinista, ejecuta en su lugar el workflow manual `CI` en la referencia de lanzamiento.
4. Selecciona la etiqueta de lanzamiento exacta y no preliminar de `openclaw/openclaw-windows-node` cuyos instaladores firmados x64 y ARM64 deben publicarse. Guárdala como `windows_node_tag` y guarda su mapa de resúmenes validado como `windows_node_installer_digests`. El asistente de candidato de lanzamiento registra ambos y los incluye en su comando de publicación generado.
5. Guarda los valores correctos de `preflight_run_id` y `full_release_validation_run_id`.
6. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado, el `preflight_run_id` guardado y el `full_release_validation_run_id` guardado. Publica los plugins externalizados en npm y ClawHub antes de promover el paquete npm de OpenClaw.
7. Si el lanzamiento llegó a `beta`, usa el workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promover esa versión estable de `beta` a `latest`.
8. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta` debe seguir inmediatamente la misma compilación estable, usa ese mismo workflow de lanzamiento para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada de autorreparación mueva `beta` más tarde.

La mutación de dist-tags vive en el repositorio del registro de lanzamientos porque todavía requiere `NPM_TOKEN`, mientras que el repositorio fuente mantiene la publicación solo con OIDC. Eso mantiene tanto la ruta de publicación directa como la ruta de promoción que empieza por beta documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la CLI de 1Password (`op`) solo dentro de una sesión dedicada de tmux. No llames a `op` directamente desde la shell principal del agente; mantenerlo dentro de tmux hace observables los prompts, las alertas y la gestión de OTP, y evita alertas repetidas del host.

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

Los mantenedores usan la documentación privada de lanzamientos en [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) para el runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
