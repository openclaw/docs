---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecutar validación de lanzamiento o aceptación de paquete
    - Buscando la nomenclatura de versiones y la cadencia
summary: Canales de lanzamiento, lista de verificación del operador, cuadros de validación, nombres de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-04T17:50:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expone actualmente tres canales de actualización orientados al usuario:

- stable: el canal de versión promovida existente, que todavía se resuelve mediante
  npm `latest` hasta que llegue el hito separado de CLI/canal
- beta: etiquetas de prelanzamiento que publican en npm `beta`
- dev: la cabecera móvil de `main`

Por separado, los operadores de lanzamiento pueden publicar el paquete principal
del mes completado anterior en npm `extended-stable`, comenzando en el parche `33`.
La línea final regular del mes actual continúa en npm `latest`; esta división de
publicación del lado del operador no cambia por sí sola la resolución del canal
de actualización de la CLI.

## Nombres de versiones

- Versión mensual de lanzamiento extended-stable en npm: `YYYY.M.PATCH`, con `PATCH >= 33`
  - Etiqueta de Git: `vYYYY.M.PATCH`
- Versión diaria/regular final: `YYYY.M.PATCH`, con `PATCH < 33`
  - Etiqueta de Git: `vYYYY.M.PATCH`
- Versión regular de corrección de fallback: `YYYY.M.PATCH-N`
  - Etiqueta de Git: `vYYYY.M.PATCH-N`
- Versión beta de prelanzamiento: `YYYY.M.PATCH-beta.N`
  - Etiqueta de Git: `vYYYY.M.PATCH-beta.N`
- No rellenes con ceros el mes ni el parche
- A partir de la actualización del proceso de lanzamiento de junio de 2026, el
  tercer componente es un número secuencial mensual del tren de lanzamiento, no
  un día calendario. Las versiones stable y beta determinan el tren actual; las
  etiquetas solo alpha no consumen ni avanzan el número de parche beta/stable.
  Las etiquetas y versiones de npm anteriores a la actualización conservan sus
  nombres existentes y siguen siendo válidas; la automatización de lanzamiento
  continúa comparándolas por año, mes, parche, canal y número de prelanzamiento
  o corrección.
- Las compilaciones alpha/nightly usan el siguiente tren de parche no publicado
  e incrementan solo `alpha.N` para compilaciones repetidas. Una vez que ese
  parche tiene una beta, las nuevas compilaciones alpha pasan al parche
  siguiente. Ignora las etiquetas heredadas solo alpha con números de parche más
  altos al seleccionar un tren beta o stable.
- Las versiones de npm son inmutables. Si una etiqueta beta ya se publicó, no la
  elimines, vuelvas a publicar ni reutilices; corta el siguiente número beta o
  el siguiente parche mensual. Como `2026.6.5-beta.1` ya se publicó durante la
  transición, los trenes de lanzamiento de junio de 2026 deben usar el parche
  `5` o superior. No publiques nuevos trenes stable o beta de junio de 2026 como
  `2026.6.2`, `2026.6.3` ni `2026.6.4`.
- Después de la final regular `2026.6.5`, el siguiente nuevo tren beta es
  `2026.6.6-beta.1`, incluso
  si ya existen etiquetas automatizadas solo alpha con números de parche más altos.
- `latest` continúa siguiendo la línea actual regular/diaria de npm
- `beta` significa el destino de instalación beta actual
- `extended-stable` significa el paquete de npm compatible del mes anterior,
  comenzando en el parche `33`; el parche `34` y posteriores son versiones de
  mantenimiento en esa línea mensual
- La ruta mensual dedicada extended-stable publica solo el paquete principal de
  npm. No publica plugins, artefactos de macOS o Windows, una GitHub Release,
  dist-tags de repositorio privado, imágenes de Docker, artefactos móviles ni
  descargas del sitio web.

## Cadencia de lanzamientos

- Los lanzamientos avanzan primero por beta
- Stable sigue solo después de validar la beta más reciente
- Los mantenedores normalmente cortan lanzamientos desde una rama `release/YYYY.M.PATCH`
  creada a partir del `main` actual, de modo que la validación y las correcciones
  de lanzamiento no bloqueen el nuevo desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los
  mantenedores cortan la siguiente etiqueta `-beta.N` en lugar de eliminar o
  recrear la etiqueta beta anterior
- El procedimiento detallado de lanzamiento, aprobaciones, credenciales y notas
  de recuperación son solo para mantenedores

## Publicación mensual extended-stable solo en npm

Esta es una excepción dedicada al procedimiento regular de lanzamiento que aparece
abajo. Para un mes completado `YYYY.M`, crea `extended-stable/YYYY.M.33`; publica
`vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La
etiqueta de lanzamiento, la punta de la rama, el checkout, la versión del paquete,
la preflight de npm y la ejecución de Full Release Validation deben identificar
todos el mismo commit. El `main` protegido ya debe contener una versión final de
un mes calendario estrictamente posterior por debajo del parche `33`; los parches
de mantenimiento siguen siendo elegibles después de que `main` avance más de un
mes.

Ejecuta la preflight de npm y Full Release Validation desde la rama exacta
extended-stable, y luego guarda ambos ID de ejecución:

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

`release_profile=stable` es el perfil existente de profundidad de validación; es
independiente del dist-tag de npm `extended-stable` y se mantiene intencionalmente
sin cambios.

Después de que ambas ejecuciones tengan éxito y el entorno de lanzamiento de npm
esté listo, promueve el tarball exacto de la preflight. El parche `P` debe ser
`33` o superior:

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
`-f bypass_extended_stable_guard=true` tanto a los dispatches de preflight como
de publicación de npm. El valor predeterminado es `false`. La omisión se acepta
solo con `npm_dist_tag=extended-stable` y se registra en el resumen del workflow.
No omite la ref de workflow canónica `extended-stable/YYYY.M.33`, la igualdad
entre punta de rama/etiqueta/checkout, la sintaxis de etiqueta final, la igualdad
entre versión de paquete/etiqueta, la identidad del manifiesto y de las ejecuciones
referenciadas, la procedencia del tarball, la aprobación de entorno, la lectura
de vuelta del registro ni la evidencia de reparación del selector.

El workflow de publicación verifica las identidades de las ejecuciones
referenciadas, el digest del tarball preparado y ambos selectores del registro
npm. Confirma de forma independiente el resultado después de que el workflow tenga
éxito:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación tiene éxito pero la
lectura de vuelta del selector falla, no vuelvas a publicar la versión inmutable
del paquete. Usa el único comando de reparación
`npm dist-tag add openclaw@YYYY.M.P extended-stable` impreso en el resumen
always-run del workflow fallido, y luego repite ambas lecturas de vuelta
independientes. Revertir al selector anterior es una decisión separada del
operador, no la ruta de reparación de lectura de vuelta.

La lista de verificación regular de abajo sigue siendo dueña de beta, `latest`,
GitHub Release, plugins, macOS, Windows y otras publicaciones de plataforma. No
ejecutes esos pasos para esta ruta extended-stable solo en npm.

## Lista de verificación regular para operadores de lanzamiento

Esta lista de verificación es la forma pública del flujo de lanzamiento. Las
credenciales privadas, la firma, la notarización, la recuperación de dist-tags y
los detalles de rollback de emergencia permanecen en el runbook de lanzamiento
solo para mantenedores.

1. Empieza desde el `main` actual: trae los últimos cambios, confirma que el commit objetivo se haya enviado,
   y confirma que el CI actual de `main` esté lo bastante verde como para crear una rama desde él.
2. Genera la sección superior de `CHANGELOG.md` a partir de los PR fusionados y todos los commits
   directos desde la última etiqueta de lanzamiento alcanzable. Mantén las entradas orientadas al usuario,
   elimina duplicados entre entradas de PR y commits directos que se solapen, confirma la reescritura, envíala,
   y haz rebase/pull una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de lanzamiento en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina la
   compatibilidad expirada solo cuando la ruta de actualización siga cubierta, o registra por qué se
   conserva intencionalmente.
4. Crea `release/YYYY.M.PATCH` desde el `main` actual; no hagas el trabajo normal de lanzamiento
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista y luego ejecuta
   `pnpm release:prep`. Esto actualiza las versiones de plugins, el inventario de plugins, el esquema de
   configuración, los metadatos de configuración de canales incluidos, la línea base de documentación de
   configuración, las exportaciones del SDK de plugins y la línea base de la API del SDK de plugins en el
   orden correcto. Confirma cualquier deriva generada antes de etiquetar. Luego ejecuta la verificación previa
   determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de lanzamiento para una verificación previa
   solo de validación. La verificación previa genera evidencia de lanzamiento de dependencias para el
   grafo de dependencias exacto extraído y la almacena en el artefacto de verificación previa de npm.
   Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas al lanzamiento con `Full Release Validation` para la
   rama de lanzamiento, etiqueta o SHA completo del commit. Este es el único punto de entrada manual
   para las cuatro cajas grandes de pruebas de lanzamiento: Vitest, Docker, QA Lab y Package.
8. Si la validación falla, corrige en la rama de lanzamiento y vuelve a ejecutar el archivo, lane,
   job de workflow, perfil de paquete, proveedor o lista de permitidos de modelos fallidos más pequeño que
   demuestre la corrección. Vuelve a ejecutar el contenedor completo solo cuando la superficie modificada
   deje obsoleta la evidencia previa.
9. Para un candidato beta etiquetado, ejecuta
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` desde la rama
   `release/YYYY.M.PATCH` correspondiente. Para estable, pasa también el lanzamiento fuente de Windows
   requerido:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   El ayudante ejecuta las comprobaciones locales de lanzamiento generado, despacha o verifica
   la validación completa de lanzamiento y la evidencia de verificación previa de npm, ejecuta la
   prueba fresh/update de Parallels contra el tarball preparado exacto más la prueba del paquete de
   Telegram, registra los planes de npm de plugins y ClawHub, e imprime el comando exacto
   `OpenClaw Release Publish` solo después de que el paquete de evidencia esté verde.
   `OpenClaw Release Publish` despacha los paquetes de plugins seleccionados o todos los publicables
   a npm y el mismo conjunto a ClawHub en paralelo, y luego promociona el artefacto preparado de
   verificación previa de npm de OpenClaw con el dist-tag correspondiente tan pronto como la publicación
   de plugins en npm tenga éxito.
   Después de que el proceso hijo de publicación de OpenClaw en npm tenga éxito, crea o actualiza la
   página de lanzamiento/prelanzamiento de GitHub correspondiente a partir de la sección completa
   coincidente de `CHANGELOG.md`. Los lanzamientos estables publicados en npm `latest` se convierten en
   el último lanzamiento de GitHub; los lanzamientos estables de mantenimiento mantenidos en npm `beta`
   se crean con GitHub `latest=false`. El workflow también sube la evidencia de dependencias de la
   verificación previa, el manifiesto de validación completa y la evidencia de verificación de registro
   posterior a la publicación al lanzamiento de GitHub para la respuesta a incidentes posteriores al
   lanzamiento. El workflow de publicación imprime los ID de ejecuciones hijas inmediatamente, aprueba
   automáticamente las puertas de entorno de lanzamiento que el token del workflow tiene permiso para
   aprobar, resume los jobs hijos fallidos con colas de logs, cierra el lanzamiento de GitHub y la
   evidencia de dependencias tan pronto como la publicación de OpenClaw en npm tiene éxito, espera a
   ClawHub siempre que se esté publicando OpenClaw en npm, luego ejecuta `pnpm release:verify-beta` y
   sube evidencia posterior a la publicación para el lanzamiento de GitHub, el paquete npm, los paquetes
   npm de plugins seleccionados, los paquetes de ClawHub seleccionados, los ID de ejecuciones de workflows
   hijos y el ID opcional de ejecución de NPM Telegram. La ruta de ClawHub reintenta fallos transitorios
   de instalación de dependencias de la CLI, publica plugins que pasan la vista previa incluso cuando una
   celda de vista previa falla de forma intermitente, y termina con verificación de registro para cada
   versión de plugin esperada, de modo que las publicaciones parciales sigan siendo visibles y reintentables.
   Luego ejecuta la aceptación de paquete posterior a la publicación contra el paquete publicado
   `openclaw@YYYY.M.PATCH-beta.N` o
   `openclaw@beta`. Si un prelanzamiento enviado o publicado necesita una corrección,
   crea el siguiente número de prelanzamiento correspondiente; no elimines ni reescribas el prelanzamiento
   anterior.
10. Para estable, continúa solo después de que la beta o el candidato de lanzamiento evaluado tenga la
    evidencia de validación requerida. La publicación estable de npm también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto exitoso de verificación previa mediante
    `preflight_run_id`; la preparación del lanzamiento estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
    El workflow de publicación de macOS publica el appcast firmado en el `main` público
    automáticamente después de verificar los activos de lanzamiento; si la protección de rama bloquea el
    push directo, abre o actualiza un PR de appcast. La preparación de Windows Hub estable requiere los
    activos firmados `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` y
    `OpenClawCompanion-SHA256SUMS.txt` en el lanzamiento de GitHub de OpenClaw.
    Pasa la etiqueta exacta del lanzamiento firmado `openclaw/openclaw-windows-node` como
    `windows_node_tag` y su mapa de resúmenes de instaladores aprobado por el candidato como
    `windows_node_installer_digests`; `OpenClaw Release Publish` mantiene el
    borrador de lanzamiento, despacha `Windows Node Release` y verifica los tres
    activos antes de la publicación.
11. Después de publicar, ejecuta el verificador de npm posterior a la publicación, el E2E independiente
    opcional de Telegram con npm publicado cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesario, verifica la página generada de lanzamiento de GitHub,
    ejecuta los pasos del anuncio de lanzamiento, y luego completa [Cierre estable de main](#stable-main-closeout)
    antes de dar por terminado un lanzamiento estable.

## Cierre estable de main

La publicación estable no está completa hasta que `main` contiene el estado de lanzamiento
realmente distribuido.

1. Empieza desde el último `main` recién actualizado. Audita `release/YYYY.M.PATCH` contra él y
   reenvía a `main` las correcciones reales que falten. No fusiones a ciegas en el `main` más nuevo
   adaptadores de compatibilidad, pruebas o validación exclusivos del lanzamiento.
2. Ajusta `main` a la versión estable distribuida, no a un tren siguiente especulativo. Ejecuta
   `pnpm release:prep` después del cambio de versión raíz y luego
   `pnpm deps:shrinkwrap:generate`.
3. Haz que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la
   rama de lanzamiento etiquetada. Incluye la actualización estable de `appcast.xml` cuando el
   lanzamiento de mac la haya publicado.
4. No agregues `YYYY.M.PATCH+1`, una versión beta ni una sección vacía de changelog futuro
   a `main` hasta que el operador inicie explícitamente ese tren de lanzamiento.
5. Ejecuta `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envía los cambios y luego verifica que `origin/main`
   contenga la versión distribuida y el changelog antes de dar por terminado el lanzamiento estable.
6. Mantén actualizadas las variables de repositorio `RELEASE_ROLLBACK_DRILL_ID` y
   `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.
   `OpenClaw Stable Main Closeout` empieza desde el push de `main` que contiene la
   versión distribuida, el changelog y el appcast después de la publicación estable. Lee
   evidencia inmutable posterior a la publicación para vincular la etiqueta distribuida con sus ejecuciones
   de Full Release Validation y Publish, luego verifica el estado estable de main, el lanzamiento,
   el periodo de observación estable obligatorio y la evidencia de rendimiento bloqueante. Adjunta un
   manifiesto inmutable de cierre y una suma de comprobación al lanzamiento de GitHub. El disparador
   automático por push omite lanzamientos heredados que preceden la evidencia inmutable posterior a la
   publicación; nunca trata esa omisión como un cierre completado. Un cierre completo requiere tanto los
   activos como una suma de comprobación coincidente. Un manifiesto parcial reproduce su SHA de `main`
   registrado y el simulacro de reversión para regenerar bytes idénticos, y luego adjunta la suma de
   comprobación faltante; un par inválido, o una suma de comprobación sin manifiesto, sigue bloqueando.
   Una ejecución disparada por push sin variables de repositorio del simulacro de reversión se omite sin
   completar el cierre; un registro de simulacro faltante o con más de 90 días de antigüedad sigue
   bloqueando el cierre manual respaldado por evidencia. Los comandos privados de recuperación permanecen
   en el runbook exclusivo de mantenedores.
   Usa el despacho manual solo para reparar o reproducir un cierre estable respaldado por evidencia.
   Una etiqueta heredada de corrección alternativa puede reutilizar evidencia del paquete base solo cuando
   la etiqueta de corrección resuelve al mismo commit fuente que la etiqueta estable base.
   Una corrección con una fuente diferente debe publicar y verificar su propia evidencia de paquete.

## Verificación previa de lanzamiento

- Ejecuta `pnpm check:test-types` antes de la comprobación previa del lanzamiento para que el TypeScript de las pruebas siga
  cubierto fuera de la puerta local más rápida de `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la comprobación previa del lanzamiento para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de lanzamiento
  `dist/*` esperados y el paquete de Control UI para el paso de validación
  del empaquetado
- Ejecuta `pnpm release:prep` después del incremento de versión raíz y antes de etiquetar. Ejecuta
  todos los generadores deterministas de lanzamiento que suelen desviarse después de un
  cambio de versión/configuración/API: versiones de plugins, inventario de plugins, esquema
  de configuración base, metadatos de configuración de canales empaquetados, línea base de documentación de configuración, exportaciones del SDK de plugins
  y línea base de API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esos
  resguardos en modo de comprobación e informa en una sola pasada de todos los fallos de desviación generada
  que encuentra antes de ejecutar las comprobaciones de lanzamiento de paquetes.
- La sincronización de versiones de plugins actualiza las versiones de paquetes de plugins oficiales y los pisos
  `openclaw.compat.pluginApi` existentes a la versión de lanzamiento de OpenClaw de forma
  predeterminada. Trata ese campo como el piso de API del SDK/runtime de plugins, no solo como una copia
  de la versión del paquete: para lanzamientos solo de plugins que permanecen intencionalmente
  compatibles con hosts OpenClaw anteriores, mantén el piso en la API de host más antigua compatible
  y documenta esa elección en la prueba de lanzamiento del plugin.
- Ejecuta el workflow manual `Full Release Validation` antes de aprobar el lanzamiento para
  iniciar todas las cajas de prueba previas al lanzamiento desde un único punto de entrada. Acepta una rama,
  etiqueta o SHA completo de commit, despacha `CI` manual y despacha
  `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes
  entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables y completas
  siempre incluyen live/E2E exhaustivo y soak de ruta de lanzamiento Docker;
  `run_release_soak=true` se conserva para un soak beta explícito. Package
  Acceptance proporciona el E2E canónico de Telegram del paquete durante la validación
  del candidato, evitando un segundo sondeador live concurrente.
  Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete npm
  enviado en las comprobaciones de lanzamiento, Package Acceptance y el E2E de Telegram
  del paquete sin reconstruir el tarball de lanzamiento. Proporciona
  `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado
  distinto del resto de la validación de lanzamiento. Proporciona
  `package_acceptance_package_spec` cuando Package Acceptance deba usar un paquete publicado
  distinto de la especificación del paquete de lanzamiento. Proporciona
  `evidence_package_spec` cuando el informe de evidencia de lanzamiento deba demostrar que la
  validación coincide con un paquete npm publicado sin forzar el E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Ejecuta el workflow manual `Package Acceptance` cuando quieras prueba de canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` confiable con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS público con un
  SHA-256 requerido y una política estricta de URL pública; `source=trusted-url` para una
  política de fuente confiable con nombre usando `trusted_source_id` y SHA-256 requeridos; o
  `source=artifact` para un tarball subido por otra ejecución de GitHub Actions. El
  workflow resuelve el candidato a
  `package-under-test`, reutiliza el programador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto
  del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona
  la línea base publicada. `update-restart-auth` usa el paquete candidato como
  CLI instalada y como package-under-test para ejercitar la
  ruta de reinicio gestionado del comando de actualización del candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto para paquete/actualización/reinicio/plugin sin OpenWebUI ni ClawHub live
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada
- Ejecuta el workflow manual `CI` directamente cuando solo necesites cobertura de CI normal
  determinista para el candidato de lanzamiento. Los despachos manuales de CI omiten el alcance por cambios
  y fuerzan los shards de Linux Node, shards de plugins empaquetados, shards de contratos de plugins y
  canales, compatibilidad con Node 22, `check-*`, `check-additional-*`,
  comprobaciones smoke de artefactos construidos, comprobaciones de documentación, Skills de Python, Windows, macOS y
  carriles de i18n de Control UI. Las ejecuciones manuales independientes de CI ejecutan Android solo cuando se despachan
  con `include_android=true`; `Full Release Validation` pasa esa entrada a
  su hijo de CI.
  Ejemplo con Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y logs,
  además de atributos de traza acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro recopilador externo.
- Ejecuta `pnpm qa:otel:collector-smoke` al validar la compatibilidad con recopiladores.
  Enruta la misma exportación OTLP de QA-lab a través de un contenedor Docker real de OpenTelemetry Collector
  antes de las aserciones del receptor local.
- Ejecuta `pnpm qa:prometheus:smoke` al validar el scraping protegido de Prometheus.
  Ejercita QA-lab, rechaza scrapes no autenticados y verifica que las familias de métricas
  críticas para el lanzamiento permanezcan libres de contenido de prompts, identificadores sin procesar,
  tokens de autenticación y rutas locales.
- Ejecuta `pnpm qa:observability:smoke` cuando quieras los carriles smoke de OpenTelemetry
  y Prometheus del checkout fuente de forma consecutiva.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- La comprobación previa de `OpenClaw NPM Release` genera evidencia de lanzamiento de dependencias antes
  de empaquetar el tarball de npm. La puerta de vulnerabilidades de avisos de npm es
  bloqueante para el lanzamiento. Los informes de riesgo del manifiesto transitivo, superficie de propiedad/instalación
  de dependencias y cambios de dependencias son solo evidencia de lanzamiento. El
  informe de cambios de dependencias compara el candidato de lanzamiento con la etiqueta de lanzamiento
  alcanzable anterior.
- La comprobación previa sube la evidencia de dependencias como
  `openclaw-release-dependency-evidence-<tag>` y también la incrusta bajo
  `dependency-evidence/` dentro del artefacto de comprobación previa de npm preparado. La ruta real
  de publicación reutiliza ese artefacto de comprobación previa y luego adjunta la misma evidencia
  al lanzamiento de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación mutante después de que
  exista la etiqueta. Despáchalo desde `release/YYYY.M.PATCH` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento, el
  `preflight_run_id` de npm de OpenClaw correcto y el `full_release_validation_run_id` correcto, y conserva
  el alcance predeterminado de publicación de plugins `all-publishable` salvo que estés ejecutando
  deliberadamente una reparación enfocada. El workflow serializa la publicación npm de plugins, la publicación
  ClawHub de plugins y la publicación npm de OpenClaw para que el paquete central no se publique
  antes que sus plugins externalizados.
- `OpenClaw Release Publish` estable requiere un `windows_node_tag` exacto después de que
  exista el lanzamiento no preliminar correspondiente de `openclaw/openclaw-windows-node`.
  También requiere el mapa `windows_node_installer_digests` aprobado para el candidato.
  Antes de despachar cualquier hijo de publicación, verifica que el lanzamiento fuente esté
  publicado, no sea preliminar, contenga los instaladores x64/ARM64 requeridos y
  aún coincida con ese mapa aprobado. Luego despacha `Windows Node Release`
  mientras el lanzamiento de OpenClaw todavía es un borrador, llevando sin cambios el mapa fijado de resúmenes
  de instaladores. El workflow hijo descarga los instaladores firmados de Windows Hub
  desde esa etiqueta exacta, los compara con los resúmenes fijados, verifica que sus firmas
  Authenticode usen el firmante esperado de OpenClaw Foundation en un runner de Windows,
  escribe un manifiesto SHA-256 y sube los instaladores más el manifiesto al
  lanzamiento canónico de GitHub de OpenClaw; luego vuelve a descargar los recursos promocionados y
  verifica la pertenencia al manifiesto y los hashes. El padre verifica el contrato actual
  de recursos x64, ARM64 y checksum antes de la publicación. La recuperación directa
  rechaza nombres de recursos `OpenClawCompanion-*` inesperados antes de reemplazar los
  recursos de contrato esperados con los bytes fuente fijados. Despacha manualmente
  `Windows Node Release` solo para recuperación, y pasa siempre una etiqueta exacta, nunca
  `latest`, además del mapa JSON explícito `expected_installer_digests` del
  lanzamiento fuente aprobado. Los enlaces de descarga del sitio web deben apuntar a URL exactas de recursos
  del lanzamiento de OpenClaw para el lanzamiento estable actual, o a
  `releases/latest/download/...` solo después de verificar que la redirección latest de GitHub
  apunte a ese mismo lanzamiento; no enlaces solo a la página de lanzamiento del repositorio complementario.
- Las comprobaciones de lanzamiento ahora se ejecutan en un workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil
  live rápido de Matrix y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles live
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de Convex CI.
  Ejecuta el workflow manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte,
  medios y E2EE de Matrix en paralelo.
- La validación de runtime de instalación y actualización entre sistemas operativos forma parte de
  `OpenClaw Release Checks` y `Full Release Validation` públicos, que llaman directamente al
  workflow reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento npm corta,
  determinista y centrada en artefactos, mientras las comprobaciones live más lentas permanecen en su propio
  carril para que no detengan ni bloqueen la publicación
- Las comprobaciones de lanzamiento con secretos deben despacharse mediante `Full Release
Validation` o desde la ref del workflow `main`/release para que la lógica del workflow y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- La comprobación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA de commit completo
  de 40 caracteres de la rama de workflow actual sin requerir una etiqueta publicada
- Esa ruta SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el workflow sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real todavía requiere una etiqueta de lanzamiento real
- Ambos workflows mantienen la ruta real de publicación y promoción en runners alojados por GitHub,
  mientras que la ruta de validación no mutante puede usar los runners Linux más grandes de
  Blacksmith
- Ese workflow ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de workflow `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La comprobación previa de lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Antes de etiquetar localmente un candidato de lanzamiento, ejecuta
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El helper
  ejecuta los resguardos rápidos de lanzamiento, comprobaciones de lanzamiento npm/ClawHub de plugins, build,
  build de UI y `release:openclaw:npm:check` en el orden que detecta errores comunes
  que bloquean la aprobación antes de que comience el workflow de publicación de GitHub.
- Ejecuta `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (o la versión beta/corrección correspondiente) para verificar la ruta de
  instalación del registro publicado en un prefijo temporal nuevo
- Después de publicar una beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el conjunto compartido de credenciales de Telegram alquiladas.
  Las ejecuciones locales puntuales de mantenedores pueden omitir las variables de Convex y pasar directamente
  las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta la validación de actualización npm/fresh-target en Parallels, despacha `NPM Telegram Beta E2E`, sondea la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionadamente solo manual y
  no se ejecuta en cada fusión.
- La automatización de releases para mantenedores ahora usa preflight-then-promote:
  - la publicación npm real debe tener un `preflight_run_id` de npm correcto
  - la publicación npm real debe despacharse desde la misma rama `main` o
    `release/YYYY.M.PATCH` que la ejecución de preflight correcta
  - las releases npm estables usan `beta` por defecto
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante una entrada del flujo de trabajo
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque
    `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio fuente mantiene
    la publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una
    rama de release pero el flujo de trabajo se despacha desde `main`, define
    `public_release_branch=release/YYYY.M.PATCH`
  - la publicación macOS real debe tener un `preflight_run_id` de macOS y un
    `validate_run_id` correctos
  - las rutas de publicación real promocionan artefactos preparados en lugar de volver a reconstruirlos
- Para releases estables de corrección como `YYYY.M.PATCH-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` a `YYYY.M.PATCH-N`
  para que las correcciones de release no puedan dejar silenciosamente instalaciones globales antiguas en la
  carga base estable
- El preflight de release npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga no vacía de `dist/control-ui/assets/`,
  para que no volvamos a publicar un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los puntos de entrada de Plugin publicados y
  los metadatos del paquete estén presentes en la disposición del registro instalada. Una release que
  publica cargas de runtime de Plugin faltantes falla el verificador postpublish y
  no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del empaquetado npm en
  el tarball de actualización candidato, de modo que el e2e del instalador detecte aumentos accidentales del tamaño del paquete
  antes de la ruta de publicación de release
- Si el trabajo de release tocó la planificación de CI, manifiestos de tiempos de extensiones o
  matrices de pruebas de extensiones, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard`, propiedad del planificador, desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación, para que las notas de release no
  describan una disposición de CI obsoleta
- La preparación para la release estable de macOS también incluye las superficies del actualizador:
  - la release de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de la publicación; el
    flujo de trabajo de publicación macOS lo confirma automáticamente, o abre un PR de appcast
    cuando el push directo está bloqueado
  - la app empaquetada debe mantener un bundle id no debug, una URL de feed de Sparkle no vacía
    y un `CFBundleVersion` igual o superior al piso canónico de build de Sparkle
    para esa versión de release

## Entornos de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Para una prueba de commit fijado en una rama que avanza rápidamente, usa el
asistente para que cada flujo de trabajo hijo se ejecute desde una rama temporal fijada al SHA
objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El asistente sube `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo de trabajo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita validar por accidente una ejecución hija
más reciente de `main`.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo de trabajo
confiable `main` y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

El flujo de trabajo resuelve la referencia objetivo, despacha el `CI` manual con
`target_ref=<release-ref>` y luego despacha `OpenClaw Release Checks`.
`OpenClaw Release Checks` distribuye pruebas smoke de instalación, comprobaciones de lanzamiento
entre sistemas operativos, cobertura live/E2E de la ruta de lanzamiento en Docker cuando soak está habilitado,
Package Acceptance con el E2E canónico del paquete Telegram, paridad de QA Lab, Matrix live y
Telegram live. Una ejecución completa/all solo es aceptable cuando el resumen de `Full Release Validation`
muestra `normal_ci`, `plugin_prerelease` y `release_checks` como
correctos, salvo que una repetición enfocada haya omitido intencionadamente el hijo separado `Plugin
Prerelease`. Usa el hijo independiente `npm-telegram` solo para una repetición enfocada de
paquete publicado con `release_package_spec` o
`npm_telegram_package_spec`. El resumen final del
verificador incluye tablas de los trabajos más lentos para cada ejecución hija, de modo que el responsable de lanzamiento
pueda ver la ruta crítica actual sin descargar registros.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la
matriz de etapas completa, los nombres exactos de trabajos del flujo de trabajo, las diferencias entre los perfiles estable y completo,
artefactos y controles de repetición enfocada.
Los flujos de trabajo hijos se despachan desde la referencia confiable que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` objetivo apunta a una
rama o etiqueta de lanzamiento anterior. No hay una entrada separada de referencia de flujo de trabajo de Full Release Validation;
elige el arnés confiable eligiendo la referencia de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para una prueba exacta de commit en `main` móvil;
los SHA de commit sin procesar no pueden ser referencias de despacho de flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: ruta OpenAI/core live y Docker más rápida y crítica para el lanzamiento
- `stable`: minimum más cobertura estable de proveedores/backends para la aprobación del lanzamiento
- `full`: stable más cobertura amplia consultiva de proveedores/medios

La validación estable y completa siempre ejecuta el barrido exhaustivo live/E2E, de
ruta de lanzamiento en Docker y acotado de supervivencia de actualización publicada antes de la promoción.
Usa `run_release_soak=true` para solicitar ese mismo barrido para una beta. Ese barrido cubre
los últimos cuatro paquetes estables más las líneas base fijadas `2026.4.23` y `2026.5.2`
más cobertura anterior de `2026.4.15`, con líneas base duplicadas eliminadas y
cada línea base fragmentada en su propio trabajo ejecutor de Docker.

`OpenClaw Release Checks` usa la referencia confiable del flujo de trabajo para resolver la referencia objetivo
una vez como `release-package-under-test` y reutiliza ese artefacto en comprobaciones entre sistemas operativos,
Package Acceptance y comprobaciones Docker de ruta de lanzamiento cuando se ejecuta soak. Esto mantiene
todos los entornos orientados al paquete sobre los mismos bytes y evita compilaciones repetidas del paquete.
Después de que una beta ya esté en npm, establece `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
para que las comprobaciones de lanzamiento descarguen una vez el paquete publicado, extraigan su SHA de origen de compilación
de `dist/build-info.json` y reutilicen ese artefacto para rutas entre sistemas operativos,
Package Acceptance, Docker de ruta de lanzamiento y Telegram de paquete.
La prueba smoke de instalación OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable de repo/organización está definida; de lo contrario usa `openai/gpt-5.4`, porque este carril
valida la instalación del paquete, el onboarding, el arranque del Gateway y un turno live de agente
en lugar de medir el modelo predeterminado más lento. La matriz live de proveedores más amplia
sigue siendo el lugar para la cobertura específica por modelo.

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

No uses el paraguas completo como primera repetición después de una corrección enfocada. Si falla un entorno,
usa el flujo de trabajo hijo, trabajo, carril Docker, perfil de paquete, proveedor de modelo
o carril QA que falló para la siguiente prueba. Ejecuta el paraguas completo otra vez solo cuando
la corrección haya cambiado la orquestación compartida de lanzamiento o haya vuelto obsoleta la evidencia anterior de todos los entornos.
El verificador final del paraguas vuelve a comprobar los id de ejecución de flujos de trabajo hijos registrados,
así que después de repetir correctamente un flujo de trabajo hijo, repite solo el trabajo padre fallido
`Verify full validation`.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
de candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease`
ejecuta solo el hijo de Plugin exclusivo de lanzamiento, `release-checks` ejecuta todos los entornos de lanzamiento,
y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las repeticiones enfocadas de `npm-telegram` requieren `release_package_spec` o
`npm_telegram_package_spec`; las ejecuciones completas/all usan el E2E canónico del paquete Telegram
dentro de Package Acceptance. Las repeticiones enfocadas
entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u
otro filtro de sistema operativo/suite. Los fallos de QA release-check bloquean la validación normal
del lanzamiento, incluida la deriva requerida de herramientas dinámicas de OpenClaw en el nivel estándar.
Las ejecuciones alpha de Tideclaw todavía pueden tratar los carriles release-check que no sean de seguridad de paquete como
consultivos. Cuando `live_suite_filter` solicita explícitamente un carril QA live con compuerta como
Discord, WhatsApp o Slack, la variable de repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente debe estar habilitada; de lo contrario
la captura de entrada falla en lugar de omitir el carril silenciosamente.

### Vitest

El entorno Vitest es el flujo de trabajo hijo manual `CI`. El CI manual omite
intencionadamente el acotamiento por cambios y fuerza el grafo de pruebas normal para el candidato de
lanzamiento: fragmentos Linux Node, fragmentos de plugins incluidos, fragmentos de contratos de Plugin y canal,
compatibilidad con Node 22, `check-*`, `check-additional-*`,
comprobaciones smoke de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS
e i18n de Control UI. Android se incluye cuando `Full Release Validation` ejecuta el
entorno porque el paraguas pasa `include_android=true`; el CI manual independiente
requiere `include_android=true` para cobertura de Android.

Usa este entorno para responder "¿pasó el árbol de código fuente la suite normal completa de pruebas?"
No es lo mismo que la validación de producto por ruta de lanzamiento. Evidencia que conservar:

- resumen de `Full Release Validation` que muestre la URL de ejecución de `CI` despachada
- ejecución de `CI` en verde sobre el SHA objetivo exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando
  una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesite CI normal determinista pero
no los entornos Docker, QA Lab, live, entre sistemas operativos o de paquete. Usa el primer comando
para CI directo sin Android. Añade `include_android=true` cuando el CI directo de
candidato de lanzamiento deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

El entorno Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo
`install-smoke` en modo de lanzamiento. Valida el candidato de lanzamiento mediante entornos
Docker empaquetados en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de lanzamiento incluye:

- prueba smoke de instalación completa con la prueba smoke lenta de instalación global de Bun habilitada
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA objetivo, con trabajos de QR,
  raíz/Gateway e instalador/Bun smoke ejecutándose como fragmentos install-smoke separados
- carriles E2E de repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- carriles divididos de instalación/desinstalación de plugins incluidos
  `bundled-plugin-install-uninstall-0` hasta
  `bundled-plugin-install-uninstall-23`
- suites de proveedores live/E2E y cobertura Docker de modelos live cuando las comprobaciones de lanzamiento
  incluyen suites live

Usa los artefactos de Docker antes de repetir. El planificador de ruta de lanzamiento sube
`.artifacts/docker-tests/` con registros de carriles, `summary.json`, `failures.json`,
tiempos de fases, JSON del plan del planificador y comandos de repetición. Para recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reusable live/E2E en lugar de
repetir todos los fragmentos de lanzamiento. Los comandos de repetición generados incluyen
`package_artifact_run_id` previo y entradas de imagen Docker preparada cuando estén disponibles, para que un
carril fallido pueda reutilizar el mismo tarball y las imágenes GHCR.

### QA Lab

El entorno QA Lab también forma parte de `OpenClaw Release Checks`. Es la compuerta de lanzamiento
de comportamiento agentivo y nivel de canal, separada de Vitest y de la mecánica de paquetes Docker.

La cobertura de QA Lab de lanzamiento incluye:

- carril de paridad mock que compara el carril candidato OpenAI con la línea base Opus 4.6
  usando el paquete de paridad agentiva
- perfil QA de Matrix live rápido usando el entorno `qa-live-shared`
- carril QA live de Telegram usando concesiones de credenciales Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` o
  `pnpm qa:observability:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa este entorno para responder "¿se comporta correctamente el lanzamiento en escenarios QA y
flujos de canales live?" Conserva las URL de artefactos para los carriles de paridad, Matrix y Telegram
al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una
ejecución manual fragmentada de QA-Lab en lugar del carril crítico predeterminado del lanzamiento.

### Paquete

El entorno Package es la compuerta de producto instalable. Está respaldado por
`Package Acceptance` y el resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y SHA-256, y mantiene la
referencia del arnés de flujo de trabajo separada de la referencia de origen del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de
  lanzamiento de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA de commit completo
  `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS público con `package_sha256`
  requerido; se rechazan credenciales de URL, puertos HTTPS no predeterminados,
  nombres de host o direcciones resueltas privadas/internas/de uso especial, y
  redirecciones inseguras
- `source=trusted-url`: descarga un `.tgz` HTTPS con `package_sha256` y
  `trusted_source_id` requeridos desde una política nombrada en
  `.github/package-trusted-sources.json`; usa esto para espejos empresariales
  propiedad de mantenedores o repositorios de paquetes privados en lugar de
  agregar a `source=url` una omisión de red privada a nivel de entrada
- `source=artifact`: reutiliza un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de lanzamiento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la QA de migración,
actualización, reinicio de actualización con autenticación configurada,
instalación en vivo de Skills de ClawHub, limpieza de dependencias obsoletas de
plugins, fixtures de plugins sin conexión, actualización de plugins y paquete de
Telegram contra el mismo tarball resuelto. Las comprobaciones de lanzamiento
bloqueantes usan la línea base predeterminada del paquete publicado más reciente;
el perfil beta con `run_release_soak=true`, `release_profile=stable` o
`release_profile=full` se expande a cada línea base estable publicada en npm
desde `2026.4.23` hasta `latest`, más fixtures de incidencias reportadas. Usa
Package Acceptance con `source=npm` para un candidato ya publicado,
`source=ref` para un tarball local de npm respaldado por SHA antes de publicar,
`source=trusted-url` para un espejo empresarial/privado propiedad de
mantenedores, o `source=artifact` para un tarball preparado cargado por otra
ejecución de GitHub Actions. Es el reemplazo nativo de GitHub para la mayor
parte de la cobertura de paquete/actualización que antes requería Parallels. Las
comprobaciones de lanzamiento entre sistemas operativos siguen siendo
importantes para el onboarding, el instalador y el comportamiento de plataforma
específicos del sistema operativo, pero la validación de producto de
paquete/actualización debe preferir Package Acceptance.

La lista de comprobación canónica para validación de actualizaciones y plugins
es [Probar actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala al
decidir qué carril local, Docker, Package Acceptance o de comprobación de
lanzamiento prueba un cambio de instalación/actualización de plugin, limpieza de
doctor o migración de paquete publicado. La migración exhaustiva de actualización
publicada desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual
`Update Migration` separado, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está limitada intencionalmente en el
tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para
brechas de metadatos ya publicadas en npm: entradas privadas de inventario de QA
faltantes en el tarball, falta de `gateway install --wrapper`, archivos de
parche faltantes en el fixture de git derivado del tarball, falta de
`update.channel` persistido, ubicaciones heredadas de registros de instalación
de plugins, falta de persistencia de registros de instalación del marketplace y
migración de metadatos de configuración durante `plugins update`. El paquete
publicado `2026.4.26` puede advertir por archivos de sello de metadatos de
compilación local que ya se publicaron. Los paquetes posteriores deben cumplir
los contratos de paquete modernos; esas mismas brechas fallan la validación de
lanzamiento.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de lanzamiento
trate sobre un paquete instalable real:

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

- `smoke`: carriles rápidos de instalación de paquete/canal/agente, red de
  Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/reinicio/paquete de plugin
  más prueba de instalación en vivo de Skills de ClawHub; este es el valor
  predeterminado de comprobación de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web
  de OpenAI y OpenWebUI
- `full`: fragmentos de ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para prueba de Telegram de candidato de paquete, habilita
`telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package
Acceptance. El flujo de trabajo pasa el tarball resuelto `package-under-test` al
carril de Telegram; el flujo de trabajo independiente de Telegram aún acepta una
especificación de npm publicada para comprobaciones posteriores a la publicación.

## Automatización regular de publicación de lanzamientos

Para publicación beta, `latest`, de plugins, GitHub Release y plataformas,
`OpenClaw Release Publish` es el punto de entrada mutante normal. La ruta mensual
`.33+` de extended-stable solo para npm no usa este orquestador. El flujo de
trabajo regular orquesta los flujos de trabajo de publicador de confianza en el
orden que el lanzamiento necesita:

1. Extraer la etiqueta de lanzamiento y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de lanzamiento, dist-tag de
   npm y `preflight_run_id` guardado después de verificar el
   `full_release_validation_run_id` guardado.
7. Para lanzamientos estables, crear o actualizar el lanzamiento de GitHub como
   borrador, despachar `Windows Node Release` con el `windows_node_tag`
   explícito y los `windows_node_installer_digests` aprobados por el candidato,
   y verificar los artefactos canónicos de instalador/suma de comprobación antes
   de publicar el borrador.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publicación estable al dist-tag beta predeterminado:

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

Usa los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin
ClawHub Release` solo para trabajo enfocado de reparación o republicación.
`OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando
`publish_openclaw_npm=true` para que el paquete central no pueda publicarse sin
cada plugin oficial publicable, incluido `@openclaw/diffs-language-pack`. Para
una reparación de plugin seleccionado, establece `publish_openclaw_npm=false` con
`plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despacha
directamente el flujo de trabajo hijo.

## Entradas del flujo de trabajo NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida, como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA de
  commit completo actual de 40 caracteres de la rama del flujo de trabajo para
  preflight solo de validación
- `preflight_only`: `true` solo para validación/compilación/paquete, `false`
  para la ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el flujo
  de trabajo reutilice el tarball preparado de la ejecución de preflight exitosa
- `full_release_validation_run_id`: requerido para publicación mensual real de
  extended-stable y regular no beta, para que el flujo de trabajo autentique la
  ejecución de validación exacta
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta
  `alpha`, `beta`, `latest` o `extended-stable` y el valor predeterminado es
  `beta`. El parche final `33` y posteriores deben usar `extended-stable`; de
  forma predeterminada, `extended-stable` rechaza parches anteriores y siempre
  rechaza etiquetas no finales.
- `bypass_extended_stable_guard`: booleano solo para pruebas, predeterminado
  `false`; con `npm_dist_tag=extended-stable`, omite la elegibilidad mensual de
  extended-stable mientras conserva las comprobaciones de identidad de
  lanzamiento, artefacto, aprobación y lectura de vuelta.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento requerida; ya debe existir
- `preflight_run_id`: id de ejecución de preflight exitosa de `OpenClaw NPM
  Release`; requerido cuando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id de ejecución exitosa de `Full Release
  Validation`; requerido cuando `publish_openclaw_npm=true`
- `windows_node_tag`: etiqueta de lanzamiento exacta no preliminar de
  `openclaw/openclaw-windows-node`; requerida para publicación estable de
  OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado por el candidato
  de los nombres actuales de instaladores de Windows a sus resúmenes
  `sha256:` fijados; requerido para publicación estable de OpenClaw
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw
- `plugin_publish_scope`: predeterminado `all-publishable`; usa `selected` solo
  para trabajo enfocado de reparación solo de plugins con
  `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: predeterminado `true`; establece `false` solo al usar
  el flujo de trabajo como orquestador de reparación solo de plugins
- `wait_for_clawhub`: predeterminado `false` para que la disponibilidad de npm no
  quede bloqueada por el sidecar de ClawHub; establece `true` solo cuando la
  finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA de commit completo para validar. Las
  comprobaciones que contienen secretos requieren que el commit resuelto sea
  alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento.
- `run_release_soak`: optar por soak exhaustivo en vivo/E2E, ruta de lanzamiento
  de Docker y upgrade-survivor desde todos los paquetes para comprobaciones de
  lanzamiento beta. Se fuerza con `release_profile=stable` y
  `release_profile=full`.

Reglas:

- Las versiones finales regulares y de corrección por debajo del parche `33`
  pueden publicarse en `beta` o `latest`. Las versiones finales en el parche
  `33` o superior deben publicarse en `extended-stable`, y se rechazan las
  versiones con sufijo de corrección en ese límite.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA de commit completo solo se
  permite cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son solo de
  validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante el
  preflight; el flujo de trabajo verifica que los metadatos antes de publicar
  sigan coincidiendo

## Secuencia regular de lanzamiento estable beta/latest

Esta secuencia heredada es para el lanzamiento orquestado regular que también
posee plugins, GitHub Release, Windows y otro trabajo de plataforma. No es la
ruta mensual `.33+` de extended-stable solo para npm documentada al inicio de
esta página.

Al preparar un lanzamiento estable orquestado regular:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA actual completo del commit
     de la rama del workflow para una ejecución de prueba de solo validación del workflow de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal de beta primero, o `latest` solo
   cuando quieras intencionalmente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA
   completo del commit cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab,
   Matrix y Telegram desde un único workflow manual
4. Si intencionalmente solo necesitas el grafo de pruebas normal determinista, ejecuta el
   workflow manual `CI` en la referencia de lanzamiento en su lugar
5. Selecciona la etiqueta exacta de lanzamiento no preliminar de `openclaw/openclaw-windows-node`
   cuyos instaladores x64 y ARM64 firmados deben distribuirse. Guárdala como
   `windows_node_tag`, y guarda su mapa de resúmenes validado como
   `windows_node_installer_digests`. El asistente de candidato de lanzamiento registra ambos
   y los incluye en su comando de publicación generado.
6. Guarda los `preflight_run_id` y `full_release_validation_run_id` correctos
7. Ejecuta `OpenClaw Release Publish` con el mismo `tag`, el mismo `npm_dist_tag`,
   el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado,
   el `preflight_run_id` guardado y el `full_release_validation_run_id` guardado;
   publica los plugins externalizados en npm y ClawHub antes de promover el
   paquete npm de OpenClaw
8. Si el lanzamiento llegó a `beta`, usa el
   workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover esa versión estable de `beta` a `latest`
9. Si el lanzamiento se publicó intencionalmente directamente en `latest` y `beta`
   debe seguir inmediatamente la misma compilación estable, usa ese mismo workflow
   de lanzamiento para apuntar ambos dist-tags a la versión estable, o deja que su sincronización
   programada de autorrecuperación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio del registro de lanzamientos porque todavía requiere
`NPM_TOKEN`, mientras que el repositorio fuente conserva una publicación solo con OIDC.

Eso mantiene documentadas y visibles para el operador tanto la ruta de publicación directa como la ruta
de promoción con beta primero.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la
CLI (`op`) de 1Password solo dentro de una sesión tmux dedicada. No llames a `op`
directamente desde la shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
las alertas y el manejo de OTP sean observables y evita alertas repetidas del host.

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

Los mantenedores usan la documentación privada de lanzamientos en
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para el runbook real.

## Relacionado

- [Canales de lanzamiento](/es/install/development-channels)
