---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar la validación de la versión o la aceptación del paquete
    - Buscando nomenclatura de versiones y cadencia
summary: Líneas de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de versiones
x-i18n:
    generated_at: "2026-07-06T10:52:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9c40bab337e28cb1e0263a45d2d1de7a515def2492a810de8a150ef1f4fe18d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw actualmente expone tres canales de actualización orientados al usuario:

- stable: el canal de versiones promocionadas existente, que todavía se resuelve mediante npm `latest` hasta que llegue el hito independiente de CLI/canal
- beta: etiquetas de versión preliminar que se publican en npm `beta`
- dev: la cabecera móvil de `main`

Por separado, los operadores de lanzamiento pueden publicar en npm `extended-stable` el paquete core del último mes completado, a partir del parche `33`. La línea final regular del mes actual continúa en npm `latest`; esta división de publicación del lado del operador no cambia por sí sola la resolución de canales de actualización de la CLI.

Las compilaciones alfa de Tideclaw son una pista interna separada de versiones preliminares (dist-tag de npm `alpha`), cubierta en [entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [cajas de prueba de lanzamiento](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual de lanzamiento extended-stable de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta git `vYYYY.M.PATCH`
- Versión diaria/regular final de lanzamiento: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta git `vYYYY.M.PATCH`
- Versión regular de lanzamiento de corrección de respaldo: `YYYY.M.PATCH-N`, etiqueta git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta git `vYYYY.M.PATCH-alpha.N`
- Nunca rellenes con ceros el mes ni el parche
- `PATCH` es un número secuencial mensual del tren de lanzamientos, no un día calendario. Las versiones finales regulares y beta avanzan el tren actual; las etiquetas solo alfa nunca consumen ni avanzan el número de parche beta/regular, así que ignora las etiquetas heredadas solo alfa con números de parche mayores al seleccionar un tren beta o regular.
- Las compilaciones alfa/nocturnas usan el siguiente tren de parches no publicado e incrementan solo `alpha.N` para compilaciones repetidas. Una vez que ese parche tiene una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca elimines, vuelvas a publicar ni reutilices una etiqueta publicada. Corta el siguiente número de versión preliminar o el siguiente parche mensual en su lugar.
- `latest` continúa siguiendo la línea npm regular/diaria actual; `beta` es el destino de instalación beta actual
- `extended-stable` significa el paquete npm compatible del mes anterior, a partir del parche `33`; el parche `34` y posteriores son lanzamientos de mantenimiento en esa línea mensual
- Las versiones finales regulares y las correcciones regulares se publican en npm `beta` de forma predeterminada; los operadores de lanzamiento pueden apuntar explícitamente a `latest` o promocionar más tarde una compilación beta validada
- La ruta mensual dedicada extended-stable publica el paquete core de npm y cada Plugin oficial publicable en npm en la misma versión exacta. No publica plugins en ClawHub ni publica artefactos de macOS o Windows, una GitHub Release, dist-tags de repositorios privados, imágenes Docker, artefactos móviles ni descargas del sitio web.
- Cada versión final regular entrega conjuntamente el paquete npm, la app macOS y los instaladores firmados de Windows Hub. Las versiones beta normalmente validan y publican primero la ruta npm/paquete, con la compilación/firma/notarización/promoción de apps nativas reservada para la versión final regular salvo que se solicite explícitamente.

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta; stable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente cortan lanzamientos desde una rama `release/YYYY.M.PATCH` creada desde el `main` actual, para que la validación y las correcciones del lanzamiento no bloqueen el nuevo desarrollo en `main`
- Si una etiqueta beta se ha subido o publicado y necesita una corrección, los mantenedores cortan la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas de recuperación son solo para mantenedores

## Publicación mensual extended-stable solo de npm

Esta es una excepción dedicada al procedimiento regular de lanzamiento que aparece abajo. Para un mes completado `YYYY.M`, crea `extended-stable/YYYY.M.33`; publica `vYYYY.M.33` y parches de mantenimiento posteriores desde esa misma rama. La etiqueta de lanzamiento, la punta de la rama, el checkout, la versión del paquete, la preflight de npm y la ejecución de Full Release Validation deben identificar todos el mismo commit. El `main` protegido ya debe contener la versión final de un mes calendario estrictamente posterior por debajo del parche `33`; los parches de mantenimiento siguen siendo elegibles después de que `main` avance más de un mes.

En la rama exacta extended-stable, sube el paquete raíz a `YYYY.M.P`, ejecuta `pnpm release:prep` y verifica que cada paquete de extensión publicable tenga la misma versión. Haz commit y push de todos los cambios generados, crea y sube la etiqueta inmutable `vYYYY.M.P` en ese commit, y registra el SHA completo resultante. Los flujos de trabajo consumen este árbol preparado; no suben ni sincronizan versiones por ti.

Ejecuta la preflight de npm y Full Release Validation desde esa punta exacta de la rama preparada, luego guarda ambos ID de ejecución:

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

`release_profile=stable` es el perfil existente de profundidad de validación; es independiente del dist-tag de npm `extended-stable` y se mantiene intencionalmente sin cambios.

Después de que ambas ejecuciones tengan éxito, publica cada Plugin oficial publicable en npm desde la misma punta exacta de la rama. El parche `P` debe ser `33` o mayor. Pasa el SHA completo del lanzamiento como `ref`, espera la matriz completa y la lectura del registro, y luego guarda el ID de ejecución exitoso de Plugin NPM Release:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo usa el inventario regular preparado de paquetes `all-publishable`, incluidos los paquetes cuyo código fuente no cambió. Verifica cada paquete exacto y cada etiqueta de Plugin `extended-stable` antes de tener éxito. Si falla una ejecución parcial, vuelve a ejecutar el mismo comando: los paquetes ya publicados se reutilizan, las etiquetas de Plugin faltantes o obsoletas se concilian bajo el entorno de lanzamiento de npm, y la lectura final todavía cubre el conjunto completo de paquetes.

Después de que el flujo de trabajo de plugins tenga éxito y el entorno de lanzamiento de npm esté listo, publica el tarball exacto de preflight del core. La publicación del core verifica que la ejecución de plugins referenciada esté `completed/success` en la misma rama canónica y el SHA exacto de origen:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Para un fork o ensayo no productivo que intencionalmente no pueda satisfacer la política mensual `.33` o de mes de `main` protegido, añade `-f bypass_extended_stable_guard=true` tanto a los dispatches de preflight como de publicación de npm. El valor predeterminado es `false`. El bypass solo se acepta con `npm_dist_tag=extended-stable` y se registra en el resumen del flujo de trabajo. No omite la ref canónica del flujo de trabajo `extended-stable/YYYY.M.33`, la igualdad de punta de rama/etiqueta/checkout, la sintaxis de etiqueta final, la igualdad de versión de paquete/etiqueta, la identidad de ejecución y manifiesto referenciada, la procedencia del tarball, la aprobación del entorno, la lectura del registro ni la evidencia de reparación de selector.

El flujo de trabajo de publicación verifica las identidades de las ejecuciones referenciadas de preflight, validación y plugins, el digest del tarball preparado y los selectores del registro core. Confirma independientemente el resultado después de que el flujo de trabajo tenga éxito:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación tiene éxito pero falla la lectura del selector, no vuelvas a publicar la versión inmutable del paquete. Usa el único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable` impreso en el resumen always-run del flujo de trabajo fallido, y luego repite ambas lecturas independientes. Revertir al selector anterior es una decisión de operador separada, no la ruta de reparación de lectura.

La documentación de soporte pública designa inicialmente Slack, Discord y Codex como superficies de Plugin cubiertas por extended-stable. Esa lista es una declaración de soporte, no una lista de permitidos del código de lanzamiento: cada Plugin oficial publicable en npm sigue la misma ruta de publicación de versión exacta.

La lista de comprobación regular de abajo sigue siendo dueña de beta, `latest`, GitHub Release, plugins, macOS, Windows y otras publicaciones de plataforma. No ejecutes esos pasos para esta ruta extended-stable solo de npm.

## Lista de comprobación regular para operadores de lanzamiento

Esta lista de comprobación es la forma pública del flujo de lanzamiento. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el runbook de lanzamiento solo para mantenedores.

1. Empieza desde el `main` actual: trae lo último, confirma que el commit objetivo se haya subido y confirma que la CI de `main` esté lo suficientemente verde para crear una rama desde ahí.
2. Genera la sección superior de `CHANGELOG.md` a partir de los PR fusionados y todos los commits directos desde la última etiqueta de lanzamiento alcanzable. Mantén las entradas orientadas al usuario, elimina duplicados entre entradas solapadas de PR/commit directo, haz commit, sube los cambios y vuelve a hacer rebase/pull una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en `src/plugins/compat/registry.ts` y `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la compatibilidad vencida solo cuando la ruta de actualización siga cubierta, o registra por qué se conserva intencionalmente.
4. Crea `release/YYYY.M.PATCH` desde el `main` actual. No hagas trabajo normal de lanzamiento directamente en `main`.
5. Sube cada ubicación de versión requerida para la etiqueta y luego ejecuta `pnpm release:prep`. Esto actualiza en orden versiones de plugins, shrinkwraps de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, línea base de documentos de configuración, exportaciones del SDK de Plugin y línea base de API del SDK de Plugin. Haz commit de cualquier deriva generada antes de etiquetar, luego ejecuta la preflight determinista local: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, se permite un SHA completo de 40 caracteres de la rama de lanzamiento para preflight solo de validación. La preflight genera evidencia de lanzamiento de dependencias para el grafo exacto de dependencias en checkout y la almacena en el artefacto de preflight de npm. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la rama de lanzamiento, etiqueta o SHA completo de commit. Este es el único punto de entrada manual para las cuatro grandes cajas de prueba de lanzamiento: Vitest, Docker, QA Lab y Package. Guarda el `full_release_validation_run_id`; es una entrada requerida tanto para `OpenClaw NPM Release` como para `OpenClaw Release Publish`.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, lane, job de flujo de trabajo, perfil de paquete, proveedor o lista de permitidos de modelo fallidos más pequeños que prueben la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie cambiada haga obsoleta la evidencia previa.
9. Para un candidato beta etiquetado, ejecuta `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` desde la rama `release/YYYY.M.PATCH` correspondiente. Para stable, pasa también el lanzamiento fuente requerido de Windows: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. El helper ejecuta las comprobaciones locales de lanzamiento generado, despacha o verifica la evidencia de validación completa de lanzamiento y preflight de npm, ejecuta prueba fresca/de actualización de Parallels contra el tarball exacto preparado más prueba del paquete de Telegram, registra planes de npm de plugins y ClawHub, e imprime el comando exacto `OpenClaw Release Publish` solo después de que el paquete de evidencia esté verde.

   `OpenClaw Release Publish` despacha los paquetes de plugins seleccionados o todos los publicables a npm y el mismo conjunto a ClawHub en paralelo; luego promociona el artefacto de preflight de npm de OpenClaw preparado con la dist-tag correspondiente una vez que la publicación de plugins en npm se realiza correctamente. Después de que el proceso hijo de publicación de OpenClaw en npm se realiza correctamente, crea o actualiza la página de lanzamiento/prelanzamiento de GitHub correspondiente desde la sección completa coincidente de `CHANGELOG.md`: los lanzamientos estables publicados en npm `latest` pasan a ser el lanzamiento más reciente de GitHub, y los lanzamientos estables de mantenimiento mantenidos en npm `beta` se crean con GitHub `latest=false`. El workflow también sube al lanzamiento de GitHub la evidencia de dependencias de preflight, el manifiesto de validación completa y la evidencia de verificación del registro posterior a la publicación para la respuesta a incidentes posterior al lanzamiento. Imprime los ID de ejecución de procesos hijos inmediatamente, aprueba automáticamente las compuertas de entorno de lanzamiento que el token del workflow tiene permiso para aprobar, resume los trabajos hijos fallidos con los finales de registros, cierra el lanzamiento de GitHub y la evidencia de dependencias en cuanto la publicación de OpenClaw en npm se realiza correctamente, espera a ClawHub siempre que OpenClaw se esté publicando en npm, luego ejecuta `pnpm release:verify-beta` y sube evidencia posterior a la publicación para el lanzamiento de GitHub, el paquete npm, los paquetes npm de plugins seleccionados, los paquetes de ClawHub seleccionados, los ID de ejecución de workflows hijos y el ID opcional de ejecución NPM Telegram. La ruta de ClawHub reintenta fallos transitorios de instalación de dependencias de la CLI, publica plugins que superan la vista previa incluso cuando una celda de vista previa falla de forma intermitente, y termina con verificación del registro para cada versión esperada de Plugin, de modo que las publicaciones parciales permanezcan visibles y reintentables.

   Luego ejecuta la aceptación de paquetes posterior a la publicación contra el paquete publicado `openclaw@YYYY.M.PATCH-beta.N` u `openclaw@beta`. Si un prelanzamiento enviado o publicado necesita una corrección, crea el siguiente número de prelanzamiento correspondiente; nunca elimines ni reescribas el anterior.

10. Para estable, continúa solo después de que la beta o candidata de lanzamiento evaluada tenga la evidencia de validación requerida. La publicación estable en npm también pasa por `OpenClaw Release Publish`, reutilizando el artefacto de preflight exitoso mediante `preflight_run_id`. La preparación del lanzamiento estable de macOS también requiere los `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`; el workflow de publicación de macOS publica el appcast firmado en `main` público automáticamente después de verificar los recursos del lanzamiento, o abre/actualiza un PR de appcast si la protección de rama bloquea el envío directo. La preparación estable de Windows Hub requiere los recursos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en el lanzamiento de GitHub de OpenClaw. Pasa la etiqueta exacta de lanzamiento firmada de `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes de instaladores aprobado como candidato como `windows_node_installer_digests`; `OpenClaw Release Publish` mantiene el borrador de lanzamiento, despacha `Windows Node Release` y verifica los tres recursos antes de la publicación.
11. Después de publicar, ejecuta el verificador posterior a la publicación de npm, el E2E opcional independiente de Telegram con npm publicado cuando necesites prueba de canal posterior a la publicación, la promoción de dist-tag cuando sea necesario, verifica la página de lanzamiento de GitHub generada, ejecuta los pasos de anuncio de lanzamiento y luego completa [Cierre estable de main](#stable-main-closeout) antes de considerar terminado un lanzamiento estable.

## Cierre estable de main

La publicación estable no está completa hasta que `main` contiene el estado real del lanzamiento enviado.

1. Comienza desde el `main` más reciente y limpio. Audita `release/YYYY.M.PATCH` contra él y aplica hacia adelante las correcciones reales ausentes de `main`. No fusiones a ciegas adaptadores de compatibilidad, pruebas o validación exclusivos del lanzamiento en el `main` más nuevo.
2. Establece `main` en la versión estable enviada, no en un tren siguiente especulativo. Ejecuta `pnpm release:prep` después del cambio de versión raíz y luego `pnpm deps:shrinkwrap:generate`.
3. Haz que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de lanzamiento etiquetada. Incluye la actualización estable de `appcast.xml` cuando el lanzamiento de mac la haya publicado.
4. No agregues `YYYY.M.PATCH+1`, una versión beta ni una sección vacía de changelog futuro a `main` hasta que el operador inicie explícitamente ese tren de lanzamiento.
5. Ejecuta `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envía los cambios y luego verifica que `origin/main` contenga la versión enviada y el changelog antes de dar por terminado el lanzamiento estable.
6. Mantén actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` comienza desde el push a `main` que contiene la versión enviada, el changelog y el appcast después de la publicación estable. Lee evidencia inmutable posterior a la publicación para vincular la etiqueta enviada con sus ejecuciones de Validación completa de lanzamiento y Publicación, y luego verifica el estado estable de main, el lanzamiento, la espera estable obligatoria y la evidencia de rendimiento bloqueante. Adjunta al lanzamiento de GitHub un manifiesto de cierre inmutable y una suma de comprobación. El disparador automático por push omite lanzamientos heredados anteriores a la evidencia inmutable posterior a la publicación y nunca trata esa omisión como un cierre completado.

Un cierre completo requiere tanto recursos como una suma de comprobación coincidente. Un manifiesto parcial reproduce su SHA de `main` registrado y el simulacro de reversión para regenerar bytes idénticos, y luego adjunta la suma de comprobación faltante; un par inválido, o una suma de comprobación sin manifiesto, sigue siendo bloqueante. Una ejecución disparada por push sin variables de repositorio de simulacro de reversión se omite sin completar el cierre; un registro de simulacro faltante o con más de 90 días de antigüedad sigue bloqueando el cierre manual respaldado por evidencia. Los comandos privados de recuperación permanecen en el runbook solo para mantenedores. Usa el despacho manual solo para reparar o reproducir un cierre estable respaldado por evidencia.

Una etiqueta de corrección de fallback heredada puede reutilizar evidencia del paquete base solo cuando la etiqueta de corrección se resuelve al mismo commit de origen que la etiqueta estable base. Una corrección con origen diferente debe publicar y verificar su propia evidencia de paquete.

## Preflight de lanzamiento

- Ejecuta `pnpm check:test-types` antes del preflight de lanzamiento para que el TypeScript de pruebas permanezca cubierto fuera de la compuerta local más rápida de `pnpm check`.
- Ejecuta `pnpm check:architecture` antes del preflight de lanzamiento para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén en verde fuera de la compuerta local más rápida.
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento esperados de `dist/*` y el paquete de Control UI existan para el paso de validación de empaquetado.
- Ejecuta `pnpm release:prep` después del incremento de versión raíz y antes de etiquetar. Ejecuta todos los generadores deterministas de lanzamiento que suelen desviarse después de un cambio de versión/configuración/API: versiones de plugins, shrinkwraps de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, línea base de documentación de configuración, exportaciones del SDK de plugins y línea base de API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas guardas en modo de comprobación (más una comprobación de presupuesto de superficie del SDK de plugins) e informa todos los fallos de desviación generada en una sola pasada antes de ejecutar las comprobaciones de lanzamiento de paquetes.
- La sincronización de versiones de plugins actualiza el paquete publicable de runtime `@openclaw/ai`, las versiones de paquetes de plugins oficiales y los pisos existentes de `openclaw.compat.pluginApi` a la versión de lanzamiento de OpenClaw de forma predeterminada. Trata ese campo como el piso de API del SDK/runtime de plugins, no solo como una copia de la versión del paquete: para lanzamientos solo de plugins que intencionalmente siguen siendo compatibles con hosts de OpenClaw más antiguos, mantén el piso en la API de host compatible más antigua y documenta esa decisión en la prueba de lanzamiento del Plugin.
- Ejecuta el workflow manual `Full Release Validation` antes de la aprobación de lanzamiento para iniciar todos los test boxes previos al lanzamiento desde un único punto de entrada. Acepta una rama, etiqueta o SHA completo de commit, despacha `CI` manual y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables y completas siempre incluyen live/E2E exhaustivo y espera de ruta de lanzamiento Docker; `run_release_soak=true` se conserva para una espera beta explícita. Package Acceptance proporciona el E2E canónico de Telegram de paquete durante la validación de candidatos, evitando un segundo sondeador live concurrente.

  Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete npm enviado entre las comprobaciones de lanzamiento, Package Acceptance y el E2E de Telegram de paquete sin reconstruir el tarball de lanzamiento. Proporciona `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado diferente del resto de la validación de lanzamiento. Proporciona `package_acceptance_package_spec` cuando Package Acceptance deba usar un paquete publicado diferente de la especificación de paquete de lanzamiento. Proporciona `evidence_package_spec` cuando el informe de evidencia de lanzamiento deba probar que la validación coincide con un paquete npm publicado sin forzar E2E de Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Ejecuta el workflow manual `Package Acceptance` cuando quieras prueba por canal lateral para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref` para empaquetar una rama/etiqueta/SHA confiable de `package_ref` con el arnés actual de `workflow_ref`; `source=url` para un tarball HTTPS público con un SHA-256 requerido y política estricta de URL pública; `source=trusted-url` para una política de origen confiable con nombre usando `trusted_source_id` y SHA-256 requeridos; o `source=artifact` para un tarball subido por otra ejecución de GitHub Actions.

  El workflow resuelve el candidato a `package-under-test`, reutiliza el programador de lanzamiento Docker E2E contra ese tarball y puede ejecutar QA de Telegram contra el mismo tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto de paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como package-under-test, de modo que ejercita la ruta de reinicio gestionado del comando de actualización del candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de gateway y recarga de configuración
  - `package`: carriles nativos del artefacto para paquete/actualización/reinicio/Plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada

- Ejecuta directamente el workflow manual `CI` cuando solo necesites cobertura normal determinista de CI para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios y fuerzan los shards de Linux Node, shards de plugins incluidos, shards de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos construidos, comprobaciones de documentación, Python skills, Windows, macOS y carriles de i18n de Control UI. Las ejecuciones manuales independientes de CI ejecutan Android solo cuando se despachan con `include_android=true`; `Full Release Validation` pasa esa entrada a su proceso hijo de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita QA-lab mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, además de atributos de traza acotados y la censura de contenido/identificadores sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecuta `pnpm qa:otel:collector-smoke` al validar la compatibilidad con recopiladores. Enruta la misma exportación OTLP de QA-lab a través de un contenedor Docker real de OpenTelemetry Collector antes de las aserciones del receptor local.
- Ejecuta `pnpm qa:prometheus:smoke` al validar el scraping protegido de Prometheus. Ejercita QA-lab, rechaza scrapes no autenticados y verifica que las familias de métricas críticas para el lanzamiento no contengan contenido de prompts, identificadores sin procesar, tokens de autenticación ni rutas locales.
- Ejecuta `pnpm qa:observability:smoke` para ejecutar consecutivamente las vías de smoke de OpenTelemetry y Prometheus desde un checkout de código fuente.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado.
- La comprobación previa `OpenClaw NPM Release` genera evidencia de lanzamiento de dependencias antes de empaquetar el tarball de npm. La puerta de vulnerabilidades de avisos de npm bloquea el lanzamiento. Los informes de riesgo del manifiesto transitivo, superficie de propiedad/instalación de dependencias y cambios de dependencias son solo evidencia de lanzamiento. El informe de cambios de dependencias compara el candidato de lanzamiento con la etiqueta de lanzamiento alcanzable anterior. La comprobación previa sube la evidencia de dependencias como `openclaw-release-dependency-evidence-<tag>` y también la incrusta en `dependency-evidence/` dentro del artefacto preparado de comprobación previa de npm. La ruta de publicación real reutiliza ese artefacto de comprobación previa y luego adjunta la misma evidencia al lanzamiento de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación con mutaciones después de que exista la etiqueta. Dispáralo desde `release/YYYY.M.PATCH` (o `main` al publicar una etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento, el `preflight_run_id` exitoso de npm de OpenClaw y el `full_release_validation_run_id` exitoso, y conserva el alcance predeterminado de publicación de plugins `all-publishable` salvo que estés ejecutando deliberadamente una reparación enfocada. El workflow serializa la publicación npm de plugins, la publicación de plugins en ClawHub y la publicación npm de OpenClaw para que el paquete core no se publique antes que sus plugins externalizados.
- La publicación estable de `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista el lanzamiento `openclaw/openclaw-windows-node` no preliminar correspondiente, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de disparar cualquier hijo de publicación, verifica que ese lanzamiento fuente esté publicado, no sea preliminar, contenga los instaladores x64/ARM64 requeridos y siga coincidiendo con ese mapa aprobado. Luego dispara `Windows Node Release` mientras el lanzamiento de OpenClaw todavía es un borrador, llevando sin cambios el mapa fijado de resúmenes de instaladores. El workflow hijo descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los compara con los resúmenes fijados, verifica en un runner de Windows que sus firmas Authenticode usen el firmante esperado OpenClaw Foundation, escribe un manifiesto SHA-256 y sube los instaladores y el manifiesto al lanzamiento canónico de GitHub de OpenClaw; después vuelve a descargar los activos promovidos y verifica la pertenencia al manifiesto y los hashes. El padre verifica el contrato actual de activos x64, ARM64 y de checksum antes de la publicación. La recuperación directa rechaza nombres de activos `OpenClawCompanion-*` inesperados antes de reemplazar los activos de contrato esperados con los bytes fuente fijados.

  Despacha manualmente `Windows Node Release` solo para recuperación, y pasa siempre una etiqueta exacta, nunca `latest`, además del mapa JSON explícito `expected_installer_digests` del lanzamiento fuente aprobado. Los enlaces de descarga del sitio web deben apuntar a URLs exactas de activos del lanzamiento de OpenClaw para el lanzamiento estable actual, o a `releases/latest/download/...` solo después de verificar que la redirección latest de GitHub apunte a ese mismo lanzamiento; no enlaces solo a la página de lanzamiento del repositorio companion.

- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado: `OpenClaw Release Checks`. También ejecuta la vía de paridad mock de QA Lab, además del perfil rápido Matrix en vivo y la vía QA de Telegram antes de la aprobación del lanzamiento. Las vías en vivo usan el entorno `qa-live-shared`; Telegram también usa leases de credenciales de CI de Convex. Ejecuta el workflow manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte Matrix, medios y E2EE en paralelo.
- La validación de runtime de instalación y actualización entre sistemas operativos forma parte de `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al workflow reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantener la ruta real de lanzamiento npm corta, determinista y centrada en artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su propia vía para que no detengan ni bloqueen la publicación.
- Las comprobaciones de lanzamiento que portan secretos deben despacharse mediante `Full Release Validation` o desde la ref de workflow `main`/release para que la lógica de workflow y los secretos permanezcan controlados.
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre que el commit resuelto sea alcanzable desde una rama o etiqueta de lanzamiento de OpenClaw.
- La comprobación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA actual completo de 40 caracteres del commit de la rama del workflow sin requerir una etiqueta subida. Esa ruta SHA es solo de validación y no puede promoverse a una publicación real. En modo SHA, el workflow sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real.
- Ambos workflows mantienen la ruta real de publicación y promoción en runners hospedados por GitHub, mientras que la ruta de validación sin mutaciones puede usar los runners Linux más grandes de Blacksmith.
- Ese workflow ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación previa de lanzamiento npm ya no espera a la vía separada de comprobaciones de lanzamiento.
- Antes de etiquetar localmente un candidato de lanzamiento, ejecuta `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El ayudante ejecuta las protecciones rápidas de lanzamiento, las comprobaciones de lanzamiento npm/ClawHub de plugins, la compilación, la compilación de UI y `release:openclaw:npm:check` en el orden que detecta errores comunes que bloquean la aprobación antes de que empiece el workflow de publicación de GitHub.
- Ejecuta `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta preliminar/corrección correspondiente) antes de la aprobación.
- Después de la publicación npm, ejecuta `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/corrección correspondiente) para verificar la ruta de instalación del registro publicado en un prefijo temporal nuevo.
- Después de una publicación beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar el onboarding del paquete instalado, la configuración de Telegram y E2E real de Telegram contra el paquete npm publicado usando el pool compartido de credenciales arrendadas de Telegram. Las ejecuciones locales puntuales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El ayudante ejecuta la validación de actualización npm/fresh-target de Parallels, despacha `NPM Telegram Beta E2E`, consulta la ejecución exacta del workflow, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta en cada merge.
- La automatización de lanzamientos de mantenedores usa comprobación previa y luego promoción:
  - La publicación npm real debe pasar un `preflight_run_id` de npm exitoso.
  - La publicación real debe despacharse desde la misma rama `main` o `release/YYYY.M.PATCH` que la ejecución exitosa de comprobación previa (se permite una rama alpha de Tideclaw para lanzamientos preliminares alpha).
  - Los lanzamientos npm estables usan `beta` de forma predeterminada; la publicación npm estable puede apuntar explícitamente a `latest` mediante la entrada del workflow.
  - La mutación de dist-tag de npm basada en token vive en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras que el repositorio fuente mantiene publicación solo con OIDC.
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una rama de lanzamiento pero el workflow se despacha desde `main`, define `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real de macOS debe pasar un `preflight_run_id` y un `validate_run_id` de macOS exitosos.
  - Las rutas de publicación reales promueven artefactos preparados en vez de recompilarlos otra vez.
- Para lanzamientos de corrección estables como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.PATCH` a `YYYY.M.PATCH-N` para que las correcciones de lanzamiento no puedan dejar silenciosamente instalaciones globales antiguas en la carga estable base.
- La comprobación previa de lanzamiento npm falla de forma cerrada salvo que el tarball incluya tanto `dist/control-ui/index.html` como una carga no vacía en `dist/control-ui/assets/`, para no volver a enviar un dashboard de navegador vacío.
- La verificación posterior a la publicación también comprueba que los entrypoints de plugins publicados y los metadatos de paquetes estén presentes en el layout instalado del registro. Un lanzamiento que envía cargas faltantes de runtime de plugins falla el verificador posterior a la publicación y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` de npm pack sobre el tarball candidato de actualización, para que el e2e del instalador detecte crecimiento accidental del paquete antes de la ruta de publicación del lanzamiento.
- Si el trabajo de lanzamiento tocó planificación de CI, manifiestos de tiempos de extensiones o matrices de tests de extensiones, regenera y revisa las salidas de matriz `plugin-prerelease-extension-shard` propiedad del planificador desde `.github/workflows/plugin-prerelease.yml` antes de la aprobación para que las notas de lanzamiento no describan un layout de CI obsoleto.
- La preparación para lanzamientos estables de macOS también incluye las superficies del actualizador: el lanzamiento de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados; `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar (el workflow de publicación de macOS lo commitea automáticamente, o abre un PR de appcast cuando el push directo está bloqueado); la app empaquetada debe mantener un bundle id que no sea de depuración, una URL no vacía de feed de Sparkle y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle para esa versión de lanzamiento.

## Cajas de pruebas de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde un único entrypoint. Para una prueba de commit fijado en una rama que avanza rápido, usa el ayudante para que cada workflow hijo se ejecute desde una rama temporal fijada al SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El ayudante sube `release-ci/<sha>-...`, despacha `Full Release Validation` desde esa rama con `ref=<sha>`, verifica que cada `headSha` de workflow hijo coincida con el objetivo y luego elimina la rama temporal. Esto evita probar accidentalmente una ejecución hija de un `main` más nuevo.

Para la validación de una rama o etiqueta de lanzamiento, ejecútala desde la ref de workflow `main` confiable y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

El workflow resuelve la ref de destino, despacha manualmente `CI` con `target_ref=<release-ref>` y luego despacha `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye install smoke, verificaciones de release entre sistemas operativos, cobertura live/E2E de la ruta de release en Docker cuando soak está habilitado, Package Acceptance con el E2E canónico del paquete Telegram, paridad de QA Lab, Matrix live y Telegram live. Una ejecución full/all solo es aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como exitosos, salvo que una repetición enfocada haya omitido intencionalmente el hijo separado `Plugin Prerelease`. Usa el hijo independiente `npm-telegram` solo para una repetición enfocada de paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen final del verificador incluye tablas de los trabajos más lentos para cada ejecución hija, de modo que el responsable de la release pueda ver la ruta crítica actual sin descargar logs.

Consulta [Validación de release completa](/es/reference/full-release-validation) para ver la matriz completa de etapas, los nombres exactos de jobs del workflow, las diferencias entre los perfiles stable y full, los artefactos y los identificadores de repeticiones enfocadas.

Los workflows hijos se despachan desde la ref de confianza que ejecuta `Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una rama o etiqueta de release anterior. No hay una entrada separada de ref de workflow para Full Release Validation; elige el arnés de confianza eligiendo la ref de ejecución del workflow. No uses `--ref main -f ref=<sha>` para prueba de commit exacto en una `main` móvil; los SHA de commit sin procesar no pueden ser refs de dispatch de workflow, así que usa `pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/provider:

- `minimum`: la ruta live y Docker más rápida y crítica para la release de OpenAI/core
- `stable`: minimum más cobertura estable de provider/backend para aprobación de release
- `full`: stable más cobertura amplia de provider/media de asesoría

La validación stable y full siempre ejecuta el barrido exhaustivo live/E2E, de ruta de release Docker y acotado de supervivencia a upgrades publicados antes de la promoción. Usa `run_release_soak=true` para solicitar ese mismo barrido para una beta. Ese barrido cubre los últimos cuatro paquetes stable más las líneas base fijadas `2026.4.23` y `2026.5.2` más la cobertura anterior `2026.4.15`, con líneas base duplicadas eliminadas y cada línea base dividida en shards en su propio job de ejecutor Docker.

`OpenClaw Release Checks` usa la ref de workflow de confianza para resolver la ref de destino una vez como `release-package-under-test` y reutiliza ese artefacto en las verificaciones entre sistemas operativos, Package Acceptance y Docker de ruta de release cuando se ejecuta soak. Esto mantiene todas las cajas orientadas a paquetes en los mismos bytes y evita builds repetidas del paquete. Después de que una beta ya esté en npm, configura `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las verificaciones de release descarguen el paquete publicado una vez, extraigan su SHA de origen de build desde `dist/build-info.json` y reutilicen ese artefacto para las líneas entre sistemas operativos, Package Acceptance, Docker de ruta de release y Telegram de paquete.

El install smoke de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la variable de repo/org está configurada; de lo contrario, `openai/gpt-5.5`, porque esta línea prueba la instalación del paquete, el onboarding, el arranque del Gateway y un turno live de agente, no compara el modelo predeterminado más lento. La matriz live más amplia de providers sigue siendo el lugar para la cobertura específica de modelos.

Usa estas variantes según la etapa de release:

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

No uses el paraguas full como la primera repetición después de una corrección enfocada. Si una caja falla, usa el workflow hijo, job, línea Docker, perfil de paquete, provider de modelo o línea de QA que falló para la siguiente prueba. Ejecuta el paraguas full de nuevo solo cuando la corrección haya cambiado la orquestación compartida de release o haya vuelto obsoleta la evidencia previa de todas las cajas. El verificador final del paraguas vuelve a comprobar los ids registrados de ejecuciones de workflows hijos, así que después de que un workflow hijo se repita correctamente, vuelve a ejecutar solo el job padre `Verify full validation` que falló.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real de candidato de release, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease` ejecuta solo el hijo de plugin exclusivo de release, `release-checks` ejecuta todas las cajas de release y los grupos de release más estrechos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones enfocadas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones full/all usan el E2E canónico de Telegram de paquete dentro de Package Acceptance. Las repeticiones enfocadas entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo/suite. Las fallas de release-checks de QA bloquean la validación normal de release, incluida la deriva obligatoria de herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alpha de Tideclaw aún pueden tratar las líneas de release-check que no son de seguridad de paquete como de asesoría. Cuando `live_suite_filter` solicita explícitamente una línea live de QA con compuerta como Discord, WhatsApp o Slack, la variable de repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente debe estar habilitada; de lo contrario, la captura de entrada falla en vez de omitir la línea silenciosamente.

### Vitest

La caja Vitest es el workflow hijo manual `CI`. La CI manual omite intencionalmente el acotamiento por cambios y fuerza el grafo normal de pruebas para el candidato de release: shards de Linux Node, shards de plugins incluidos, shards de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, verificaciones smoke de artefactos construidos, verificaciones de docs, Skills de Python, Windows, macOS y Control UI i18n. Android se incluye cuando `Full Release Validation` ejecuta la caja porque el paraguas pasa `include_android=true`; la CI manual independiente requiere `include_android=true` para la cobertura de Android.

Usa esta caja para responder “¿el árbol de origen pasó la suite normal completa de pruebas?”. No es lo mismo que la validación de producto de la ruta de release. Evidencia que conservar:

- resumen de `Full Release Validation` que muestra la URL de la ejecución `CI` despachada
- ejecución `CI` en verde en el SHA de destino exacto
- nombres de shards fallidos o lentos de los jobs de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando una ejecución necesita análisis de rendimiento

Ejecuta la CI manual directamente solo cuando la release necesite CI normal determinista, pero no las cajas Docker, QA Lab, live, entre sistemas operativos o de paquete. Usa el primer comando para CI directa sin Android. Añade `include_android=true` cuando la CI directa del candidato de release deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La caja Docker vive en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del workflow `install-smoke` en modo release. Valida el candidato de release mediante entornos Docker empaquetados en vez de solo pruebas a nivel de código fuente.

La cobertura Docker de release incluye:

- install smoke completo con el smoke lento de instalación global de Bun habilitado
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA de destino, con jobs smoke de QR, root/gateway e installer/Bun ejecutándose como shards separados de install-smoke
- líneas E2E de repositorio
- fragmentos Docker de ruta de release: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hasta `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- líneas divididas de instalación/desinstalación de plugins incluidos `bundled-plugin-install-uninstall-0` hasta `bundled-plugin-install-uninstall-23`
- suites live/E2E de providers y cobertura de modelos live en Docker cuando las verificaciones de release incluyen suites live

Usa los artefactos Docker antes de repetir ejecuciones. El scheduler de ruta de release sube `.artifacts/docker-tests/` con logs de línea, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del scheduler y comandos de repetición. Para recuperación enfocada, usa `docker_lanes=<lane[,lane]>` en el workflow reutilizable live/E2E en vez de repetir todos los fragmentos de release. Los comandos de repetición generados incluyen `package_artifact_run_id` previo y entradas de imágenes Docker preparadas cuando están disponibles, para que una línea fallida pueda reutilizar el mismo tarball y las mismas imágenes GHCR.

### QA Lab

La caja QA Lab también forma parte de `OpenClaw Release Checks`. Es la compuerta de release de comportamiento agéntico y nivel de canal, separada de Vitest y de la mecánica de paquetes Docker.

La cobertura QA Lab de release incluye:

- línea de paridad simulada que compara la línea candidata de OpenAI con la línea base `anthropic/claude-opus-4-8` usando el paquete de paridad agéntica
- perfil rápido de QA live Matrix usando el entorno `qa-live-shared`
- línea QA live de Telegram usando leases de credenciales CI de Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría de release necesita prueba local explícita

Usa esta caja para responder “¿la release se comporta correctamente en escenarios de QA y flujos live de canales?”. Conserva las URL de artefactos de las líneas de paridad, Matrix y Telegram al aprobar la release. La cobertura completa de Matrix sigue disponible como una ejecución manual de QA-Lab dividida en shards, en vez de la línea predeterminada crítica para la release.

### Paquete

La caja Package es la compuerta del producto instalable. Está respaldada por `Package Acceptance` y el resolver `scripts/resolve-openclaw-package-candidate.mjs`. El resolver normaliza un candidato en el tarball `package-under-test` consumido por Docker E2E, valida el inventario del paquete, registra la versión del paquete y el SHA-256, y mantiene la ref del arnés de workflow separada de la ref de origen del paquete.

Fuentes de candidato compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA de commit completo de confianza de `package_ref` con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS público con `package_sha256` requerido; se rechazan credenciales de URL, puertos HTTPS no predeterminados, nombres de host o direcciones resueltas privadas/internas/de uso especial y redirecciones inseguras
- `source=trusted-url`: descarga un `.tgz` HTTPS con `package_sha256` requerido y `trusted_source_id` desde una política con nombre en `.github/package-trusted-sources.json`; usa esto para mirrors empresariales mantenidos por maintainers o repositorios de paquetes privados en vez de añadir una omisión de red privada a nivel de entrada para `source=url`
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el artefacto del paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mantiene la QA de migración, actualización, actualización de VPS gestionado desde la raíz, reinicio de actualización con autenticación configurada, instalación de Skills de ClawHub en vivo, limpieza de dependencias obsoletas de plugins, fixtures de plugins sin conexión, actualización de plugins, endurecimiento del escape de enlace de comandos de plugins y paquete de Telegram contra el mismo tarball resuelto. Las comprobaciones de lanzamiento bloqueantes usan la línea base predeterminada del paquete publicado más reciente; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el barrido de published-upgrade-survivor a `last-stable-4` más las líneas base fijadas `2026.4.23`, `2026.5.2` y `2026.4.15` con escenarios `reported-issues`. Usa Package Acceptance con `source=npm` para un candidato ya publicado, `source=ref` para un tarball npm local respaldado por un SHA antes de publicar, `source=trusted-url` para un mirror empresarial/privado propiedad de un mantenedor, o `source=artifact` para un tarball preparado subido por otra ejecución de GitHub Actions.

Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquete/actualización que antes requería Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen siendo importantes para el onboarding específico del SO, el instalador y el comportamiento de plataforma, pero la validación del producto de paquete/actualización debe preferir Package Acceptance.

La lista de comprobación canónica para la validación de actualizaciones y plugins es [Probar actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al decidir qué carril local, Docker, Package Acceptance o de comprobación de lanzamiento demuestra un cambio de instalación/actualización de plugins, limpieza de doctor o migración de paquetes publicados. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual separado `Update Migration`, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionalmente limitada en el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para huecos de metadatos ya publicados en npm: entradas de inventario de QA privadas ausentes del tarball, falta de `gateway install --wrapper`, falta de archivos de parche en el fixture de git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, falta de persistencia de registros de instalación de marketplace y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir sobre archivos de sello de metadatos de compilación local que ya se publicaron. Los paquetes posteriores deben cumplir los contratos modernos de paquetes; esos mismos huecos fallan la validación de lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de lanzamiento sea sobre un paquete instalable real:

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
- `package`: contratos de instalación/actualización/reinicio/paquete de Plugin más prueba de instalación de Skills de ClawHub en vivo; este es el valor predeterminado de comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web de OpenAI y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para reejecuciones enfocadas

Para la prueba de Telegram de un candidato de paquete, habilita `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball resuelto `package-under-test` al carril de Telegram; el flujo de trabajo independiente de Telegram todavía acepta una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización regular de publicación de lanzamientos

Para beta, `latest`, plugins, GitHub Release y publicación de plataformas,
`OpenClaw Release Publish` es el punto de entrada mutante normal. La ruta mensual
`.33+` de extended-stable solo para npm no usa este orquestador. El
flujo de trabajo regular orquesta los flujos de trabajo de publicador confiable en el orden que
necesita el lanzamiento:

1. Comprobar la etiqueta de lanzamiento y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*` (o una rama alfa de Tideclaw para prelanzamientos alfa).
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de lanzamiento, la dist-tag de npm y el `preflight_run_id` guardado después de verificar el `full_release_validation_run_id` guardado.
7. Para lanzamientos estables, crear o actualizar el lanzamiento de GitHub como borrador, despachar `Windows Node Release` con el `windows_node_tag` explícito y los `windows_node_installer_digests` aprobados para el candidato, y verificar los activos canónicos del instalador/suma de comprobación antes de publicar el borrador.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publicación estable en la dist-tag beta predeterminada:

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

Usa los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release` solo para trabajos enfocados de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true` para que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para una reparación de Plugin seleccionado, establece `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despacha el flujo de trabajo hijo directamente.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA de commit actual completo de 40 caracteres de la rama del flujo de trabajo para preflight solo de validación
- `preflight_only`: `true` para solo validación/compilación/paquete, `false` para la ruta de publicación real
- `preflight_run_id`: id de ejecución de preflight exitoso existente, requerido en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de reconstruirlo
- `full_release_validation_run_id`: id de ejecución exitosa de `Full Release Validation` para esta etiqueta/SHA, requerido para la publicación real. Las publicaciones beta pueden continuar solo con preflight con una advertencia, pero la promoción estable/`latest` aún lo requiere.
- `release_publish_run_id`: id de ejecución aprobado de `OpenClaw Release Publish`; requerido cuando este flujo de trabajo lo despacha ese padre (llamadas de publicación real del actor bot)
- `plugin_npm_run_id`: id de ejecución exitosa de `Plugin NPM Release` de cabecera exacta; requerido para una publicación central `extended-stable` real
- `npm_dist_tag`: etiqueta npm de destino para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y por defecto es `beta`. El parche final `33` y posteriores deben usar `extended-stable`; de forma predeterminada, `extended-stable` rechaza parches anteriores, y siempre rechaza etiquetas no finales.
- `bypass_extended_stable_guard`: booleano solo para pruebas, predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la elegibilidad mensual de extended-stable mientras conserva las comprobaciones de identidad de lanzamiento, artefacto, aprobación y lectura posterior.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de lanzamiento
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La
opción extended-stable requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33`, y la rama canónica
`extended-stable/YYYY.M.33` en su punta exacta. Nunca mueve `latest` ni `beta`
de plugins. Las nuevas versiones de paquetes reciben `extended-stable` atómicamente
mediante publicación confiable OIDC (`npm publish --tag extended-stable`); este
flujo de trabajo de origen no usa `npm dist-tag add` autenticado por token. Los reintentos
omiten las versiones exactas ya presentes en npm, y luego fallan de forma cerrada salvo que la
lectura posterior completa confirme que cada paquete exacto y etiqueta `extended-stable` convergieron.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida; ya debe existir
- `preflight_run_id`: id de ejecución exitosa de preflight de `OpenClaw NPM Release`; requerido cuando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id de ejecución exitosa de `Full Release Validation`; requerido cuando `publish_openclaw_npm=true`
- `windows_node_tag`: etiqueta exacta no preliminar de lanzamiento de `openclaw/openclaw-windows-node`; requerida para publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato de los nombres actuales de instaladores de Windows a sus resúmenes `sha256:` fijados; requerido para publicación estable de OpenClaw
- `npm_telegram_run_id`: id opcional de ejecución exitosa de `NPM Telegram Beta E2E` para incluir en la evidencia final de lanzamiento
- `npm_dist_tag`: etiqueta npm de destino para el paquete OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: por defecto es `all-publishable`; usa `selected` solo para trabajo enfocado de reparación exclusiva de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: por defecto es `true`; establece `false` solo cuando uses el flujo de trabajo como orquestador de reparación exclusiva de plugins
- `release_profile`: perfil de cobertura de lanzamiento usado para resúmenes de evidencia de lanzamiento; por defecto es `from-validation`, que lo lee del manifiesto de validación, o sobrescríbelo con `beta`, `stable` o `full`
- `wait_for_clawhub`: por defecto es `false` para que la disponibilidad de npm no sea bloqueada por el sidecar de ClawHub; establece `true` solo cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las comprobaciones con secretos requieren que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento.
- `run_release_soak`: optar por el soak exhaustivo en vivo/E2E, ruta de lanzamiento de Docker y upgrade-survivor desde todos para comprobaciones de lanzamiento beta. Es forzado por `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales regulares y de corrección por debajo del parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales en el parche `33` o superior deben publicarse en `extended-stable`, y las versiones con sufijo de corrección en ese límite se rechazan.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alpha solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se permite cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son solo de validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante la comprobación previa; el flujo de trabajo verifica esos metadatos antes de que continúe la publicación

## Secuencia regular de lanzamiento estable beta/latest

Esta secuencia heredada es para el lanzamiento orquestado regular que también gestiona plugins, GitHub Release, Windows y otro trabajo de plataforma. No es la ruta mensual `.33+` npm-only extended-stable documentada al principio de esta página.

Al preparar un lanzamiento estable orquestado regular:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, puedes usar el SHA de commit completo actual de la rama del flujo de trabajo para una ejecución de prueba de validación de la comprobación previa.
2. Elige `npm_dist_tag=beta` para el flujo normal beta-first, o `latest` solo cuando quieras intencionadamente una publicación estable directa.
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA de commit completo cuando quieras CI normal más cobertura de live prompt cache, Docker, QA Lab, Matrix y Telegram desde un solo flujo de trabajo manual. Si intencionadamente solo necesitas el grafo de pruebas normal determinista, ejecuta en su lugar el flujo de trabajo manual `CI` en la referencia de lanzamiento.
4. Selecciona la etiqueta de lanzamiento exacta no preliminar de `openclaw/openclaw-windows-node` cuyos instaladores firmados x64 y ARM64 deben distribuirse. Guárdala como `windows_node_tag` y guarda su mapa de resúmenes validado como `windows_node_installer_digests`. El asistente de release-candidate registra ambos y los incluye en el comando de publicación que genera.
5. Guarda los valores correctos de `preflight_run_id` y `full_release_validation_run_id`.
6. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, sus `windows_node_installer_digests` guardados, el `preflight_run_id` guardado y el `full_release_validation_run_id` guardado. Publica plugins externalizados en npm y ClawHub antes de promocionar el paquete npm de OpenClaw.
7. Si el lanzamiento llegó a `beta`, usa el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promocionar esa versión estable de `beta` a `latest`.
8. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta` debe seguir de inmediato la misma compilación estable, usa ese mismo flujo de trabajo de lanzamiento para apuntar ambas dist-tags a la versión estable, o deja que su sincronización programada de autorreparación mueva `beta` más tarde.

La mutación de dist-tag vive en el repositorio del libro mayor de lanzamientos porque aún requiere `NPM_TOKEN`, mientras que el repositorio fuente mantiene la publicación solo con OIDC. Eso mantiene tanto la ruta de publicación directa como la ruta de promoción beta-first documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación npm local, ejecuta cualquier comando de la CLI de 1Password (`op`) solo dentro de una sesión tmux dedicada. No llames a `op` directamente desde la shell principal del agente; mantenerlo dentro de tmux hace que las indicaciones, alertas y gestión de OTP sean observables y evita alertas repetidas del host.

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

Los mantenedores usan la documentación privada de lanzamientos en [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) para el procedimiento operativo real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
