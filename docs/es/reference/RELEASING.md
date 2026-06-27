---
read_when:
    - Buscando definiciones públicas de canales de lanzamiento
    - Ejecutar la validación de versión o la aceptación de paquetes
    - Buscando nomenclatura y cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, cuadros de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-06-27T12:48:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tiene tres vías de publicación públicas:

- stable: versiones etiquetadas que se publican en npm `beta` de forma predeterminada, o en npm `latest` cuando se solicita explícitamente
- beta: etiquetas de versión preliminar que se publican en npm `beta`
- dev: la punta móvil de `main`

## Nomenclatura de versiones

- Versión de publicación estable: `YYYY.M.PATCH`
  - Etiqueta de Git: `vYYYY.M.PATCH`
- Versión de publicación de corrección estable: `YYYY.M.PATCH-N`
  - Etiqueta de Git: `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`
  - Etiqueta de Git: `vYYYY.M.PATCH-beta.N`
- No rellenes con ceros el mes ni el patch
- A partir de la actualización del proceso de publicación de junio de 2026, el tercer componente es un
  número secuencial mensual del tren de publicación, no un día del calendario. Las publicaciones estables y beta
  determinan el tren actual; las etiquetas solo alpha no consumen ni
  avanzan el número de patch beta/estable. Las etiquetas y versiones de npm anteriores a la actualización conservan
  sus nombres existentes y siguen siendo válidas; la automatización de publicación continúa
  comparándolas por año, mes, patch, canal y número de versión preliminar o de corrección.
- Las compilaciones alpha/nocturnas usan el siguiente tren de patch no publicado e incrementan solo
  `alpha.N` para compilaciones repetidas. Una vez que ese patch tiene una beta, las nuevas compilaciones alpha
  pasan al siguiente patch. Ignora las etiquetas heredadas solo alpha con números de patch
  más altos al seleccionar un tren beta o estable.
- Las versiones de npm son inmutables. Si una etiqueta beta ya se ha publicado, no la
  elimines, vuelvas a publicar ni reutilices; crea el siguiente número beta o el siguiente patch
  mensual. Como `2026.6.5-beta.1` ya se publicó durante la
  transición, los trenes de publicación de junio de 2026 deben usar el patch `5` o superior. No
  publiques nuevos trenes estables o beta de junio de 2026 como `2026.6.2`, `2026.6.3` ni
  `2026.6.4`.
- Después de la estable `2026.6.5`, el siguiente tren beta nuevo es `2026.6.6-beta.1`, incluso
  si ya existen etiquetas automatizadas solo alpha con números de patch más altos.
- `latest` significa la publicación estable actual promovida en npm
- `beta` significa el destino actual de instalación beta
- Las publicaciones estables y de corrección estable se publican en npm `beta` de forma predeterminada; los operadores de publicación pueden apuntar explícitamente a `latest`, o promover más adelante una compilación beta validada
- Cada publicación estable de OpenClaw distribuye conjuntamente el paquete npm, la app de macOS y los instaladores
  firmados de Windows Hub; las publicaciones beta normalmente validan y publican
  primero la ruta npm/paquete, y reservan la compilación/firma/notarización/promoción
  de apps nativas para estable, salvo que se solicite explícitamente

## Cadencia de publicación

- Las publicaciones avanzan primero por beta
- La estable solo sigue después de validar la beta más reciente
- Los mantenedores normalmente crean publicaciones desde una rama `release/YYYY.M.PATCH` creada
  desde el `main` actual, para que la validación y las correcciones de publicación no bloqueen el nuevo
  desarrollo en `main`
- Si una etiqueta beta se ha enviado o publicado y necesita una corrección, los mantenedores crean
  la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la etiqueta beta antigua
- El procedimiento detallado de publicación, las aprobaciones, credenciales y notas de recuperación son
  solo para mantenedores

## Lista de comprobación del operador de publicación

Esta lista de comprobación es la forma pública del flujo de publicación. Las credenciales privadas,
la firma, la notarización, la recuperación de dist-tag y los detalles de reversión de emergencia permanecen en
el runbook de publicación solo para mantenedores.

1. Empieza desde el `main` actual: trae lo último, confirma que el commit de destino se haya enviado,
   y confirma que el CI actual de `main` esté lo suficientemente verde para crear una rama desde él.
2. Genera la sección superior de `CHANGELOG.md` a partir de PRs fusionados y todos los
   commits directos desde la última etiqueta de publicación alcanzable. Mantén las entradas orientadas al usuario,
   deduplica entradas solapadas de PR/commit directo, confirma la reescritura, envíala,
   y haz rebase/pull una vez más antes de crear la rama.
3. Revisa los registros de compatibilidad de publicación en
   `src/plugins/compat/registry.ts` y
   `src/commands/doctor/shared/deprecation-compat.ts`. Elimina compatibilidad expirada
   solo cuando la ruta de actualización siga cubierta, o registra por qué se
   conserva intencionadamente.
4. Crea `release/YYYY.M.PATCH` desde el `main` actual; no hagas trabajo normal de publicación
   directamente en `main`.
5. Incrementa cada ubicación de versión requerida para la etiqueta prevista y luego ejecuta
   `pnpm release:prep`. Actualiza versiones de plugins, inventario de plugins, esquema de configuración,
   metadatos de configuración de canales incluidos, línea base de documentación de configuración, exportaciones del SDK de plugins
   y línea base de API del SDK de plugins en el orden correcto. Confirma cualquier deriva generada
   antes de etiquetar. Luego ejecuta la precomprobación determinista local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` y `pnpm release:check`.
6. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta,
   se permite un SHA completo de 40 caracteres de la rama de publicación solo para validación
   preflight. La precomprobación genera evidencia de publicación de dependencias para el
   grafo exacto de dependencias extraído y la almacena en el artefacto preflight
   de npm. Guarda el `preflight_run_id` exitoso.
7. Inicia todas las pruebas previas a la publicación con `Full Release Validation` para la
   rama de publicación, etiqueta o SHA completo de commit. Este es el único punto de entrada manual
   para las cuatro grandes cajas de prueba de publicación: Vitest, Docker, QA Lab y Paquete.
8. Si la validación falla, corrige en la rama de publicación y vuelve a ejecutar el archivo,
   carril, job de workflow, perfil de paquete, proveedor o allowlist de modelos fallido más pequeño que
   pruebe la corrección. Vuelve a ejecutar el paraguas completo solo cuando la superficie modificada vuelva
   obsoleta la evidencia previa.
9. Para una candidata beta etiquetada, ejecuta
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` desde la rama
   `release/YYYY.M.PATCH` correspondiente. Para estable, pasa también la publicación fuente requerida de Windows:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   El helper ejecuta las comprobaciones locales de publicación generada, despacha o verifica
   la evidencia completa de validación de publicación y preflight de npm, ejecuta prueba fresca/de actualización de Parallels
   contra el tarball preparado exacto más prueba del paquete de Telegram,
   registra los planes de plugins npm y ClawHub, e imprime el comando exacto
   `OpenClaw Release Publish` solo después de que el paquete de evidencia esté verde.
   `OpenClaw Release Publish` despacha los paquetes de plugins seleccionados o todos los publicables
   a npm y el mismo conjunto a ClawHub en paralelo, y luego promueve el
   artefacto preflight de npm de OpenClaw preparado con el dist-tag correspondiente tan pronto como
   la publicación npm de plugins tenga éxito.
   Después de que el hijo de publicación npm de OpenClaw tenga éxito, crea o actualiza la
   página correspondiente de publicación/versión preliminar de GitHub a partir de la sección completa correspondiente de
   `CHANGELOG.md`. Las publicaciones estables publicadas en npm `latest` se convierten en la
   publicación latest de GitHub; las publicaciones estables de mantenimiento mantenidas en npm `beta` se
   crean con GitHub `latest=false`. El workflow también carga la evidencia preflight
   de dependencias, el manifiesto de validación completa y la evidencia de verificación del registro
   postpublicación en la publicación de GitHub para respuesta a incidentes posteriores a la publicación. El workflow de publicación imprime inmediatamente los ID de ejecuciones hijas, aprueba automáticamente
   las puertas del entorno de publicación que el token del workflow puede aprobar, resume
   los jobs hijos fallidos con colas de logs, cierra la publicación de GitHub y la evidencia
   de dependencias tan pronto como la publicación npm de OpenClaw tiene éxito, espera a ClawHub siempre que
   se publique npm de OpenClaw, luego ejecuta `pnpm release:verify-beta` y
   carga evidencia postpublicación para la publicación de GitHub, paquete npm, paquetes npm de plugins
   seleccionados, paquetes ClawHub seleccionados, ID de ejecuciones de workflows hijos e
   ID opcional de ejecución NPM Telegram. La ruta de ClawHub reintenta fallos transitorios de instalación
   de dependencias de la CLI, publica plugins que pasan la vista previa incluso cuando una
   celda de vista previa tiene flakes, y termina con verificación de registro para cada versión esperada
   de plugin, de modo que las publicaciones parciales sigan siendo visibles y reintentables. Luego ejecuta la aceptación de paquete
   posterior a la publicación contra el paquete publicado
   `openclaw@YYYY.M.PATCH-beta.N` o
   `openclaw@beta`. Si una versión preliminar enviada o publicada necesita una corrección,
   crea el siguiente número de versión preliminar correspondiente; no elimines ni reescribas la versión preliminar
   antigua.
10. Para estable, continúa solo después de que la beta validada o candidata de publicación tenga la
    evidencia de validación requerida. La publicación npm estable también pasa por
    `OpenClaw Release Publish`, reutilizando el artefacto preflight exitoso mediante
    `preflight_run_id`; la preparación de publicación estable de macOS también requiere el
    `.zip`, `.dmg`, `.dSYM.zip` empaquetados y el `appcast.xml` actualizado en `main`.
    El workflow de publicación de macOS publica automáticamente el appcast firmado en `main` público
    después de verificar los assets de publicación; si la protección de rama bloquea el
    push directo, abre o actualiza un PR de appcast. La preparación estable de Windows Hub
    requiere los assets firmados `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` y
    `OpenClawCompanion-SHA256SUMS.txt` en la publicación de GitHub de OpenClaw.
    Pasa la etiqueta exacta de publicación firmada `openclaw/openclaw-windows-node` como
    `windows_node_tag` y su mapa de digests de instaladores aprobados por la candidata como
    `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el
    borrador de publicación, despacha `Windows Node Release` y verifica los tres
    assets antes de la publicación.
11. Después de publicar, ejecuta el verificador npm posterior a la publicación, el E2E opcional independiente
    de Telegram con npm publicado cuando necesites prueba de canal posterior a la publicación,
    la promoción de dist-tag cuando sea necesaria, verifica la página generada de publicación de GitHub,
    ejecuta los pasos del anuncio de publicación y luego completa [Cierre de main estable](#stable-main-closeout)
    antes de dar por terminada una publicación estable.

## Cierre de main estable

La publicación estable no está completa hasta que `main` contiene el estado real de la publicación
enviada.

1. Parta de un `main` reciente y actualizado. Audite `release/YYYY.M.PATCH` frente a él y
   reenvíe los arreglos reales que falten en `main`. No fusione a ciegas
   adaptadores de compatibilidad, pruebas o validación exclusivos de la release en el `main` más nuevo.
2. Establezca `main` en la versión estable enviada, no en un tren siguiente especulativo. Ejecute
   `pnpm release:prep` después del cambio de versión raíz y luego
   `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la
   rama de release etiquetada. Incluya la actualización estable de `appcast.xml` cuando la release de mac
   haya publicado una.
4. No agregue `YYYY.M.PATCH+1`, una versión beta ni una sección vacía de changelog futuro
   a `main` hasta que el operador inicie explícitamente ese tren de release.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Haga push y luego verifique que `origin/main`
   contenga la versión enviada y el changelog antes de dar por terminada la release estable.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y
   `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de rollback.
   `OpenClaw Stable Main Closeout` parte del push a `main` que contiene la
   versión enviada, el changelog y el appcast tras la publicación estable. Lee
   evidencia postpublicación inmutable para vincular la etiqueta enviada con sus ejecuciones de Full Release
   Validation y Publish, y luego verifica el estado estable de main, la release,
   la estabilización estable obligatoria y la evidencia de rendimiento bloqueante. Adjunta un
   manifiesto de cierre inmutable y una suma de comprobación a la release de GitHub. El disparador de
   push automático omite las releases heredadas anteriores a la evidencia postpublicación
   inmutable; nunca trata esa omisión como un cierre completado. Un cierre completo
   requiere ambos recursos y una suma de comprobación coincidente. Un manifiesto parcial
   reproduce el SHA de `main` registrado y el simulacro de rollback para regenerar bytes
   idénticos, y luego adjunta la suma de comprobación faltante; un par inválido, o una suma de comprobación
   sin manifiesto, sigue siendo bloqueante. Una ejecución disparada por push sin variables de repositorio
   del simulacro de rollback se omite sin completar el cierre; un registro de simulacro ausente o
   con más de 90 días de antigüedad sigue bloqueando el cierre manual respaldado por evidencia.
   Los comandos privados de recuperación permanecen en el runbook exclusivo para mantenedores.
   Use el despacho manual solo para reparar o reproducir un cierre estable respaldado por evidencia.
   Una etiqueta heredada de corrección de fallback puede reutilizar evidencia del paquete base solo cuando
   la etiqueta de corrección se resuelve al mismo commit fuente que la etiqueta estable base.
   Una corrección con una fuente diferente debe publicar y verificar su propia evidencia de paquete.

## Preflight de release

- Ejecuta `pnpm check:test-types` antes de la comprobación previa de lanzamiento para que el TypeScript de pruebas siga
  cubierto fuera de la puerta local más rápida `pnpm check`
- Ejecuta `pnpm check:architecture` antes de la comprobación previa de lanzamiento para que las comprobaciones más amplias de ciclos de importación
  y límites de arquitectura estén en verde fuera de la puerta local más rápida
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de lanzamiento esperados
  `dist/*` y el paquete de Control UI para el paso de validación
  del empaquetado
- Ejecuta `pnpm release:prep` después del incremento de versión raíz y antes de etiquetar. Ejecuta
  todos los generadores de lanzamiento deterministas que suelen desviarse después de un
  cambio de versión/configuración/API: versiones de Plugin, inventario de Plugin, esquema de configuración base,
  metadatos de configuración de canales empaquetados, base de referencia de documentación de configuración, exportaciones del SDK de Plugin,
  y base de referencia de la API del SDK de Plugin. `pnpm release:check` vuelve a ejecutar esos
  protectores en modo de comprobación e informa de todos los fallos de desviación generada que encuentra en una
  sola pasada antes de ejecutar las comprobaciones de lanzamiento de paquetes.
- La sincronización de versiones de Plugin actualiza de forma predeterminada las versiones de paquetes de Plugin oficiales y los límites mínimos existentes de
  `openclaw.compat.pluginApi` a la versión de lanzamiento de OpenClaw.
  Trata ese campo como el límite mínimo de la API de SDK/runtime de Plugin, no solo como una copia
  de la versión del paquete: para lanzamientos solo de Plugin que intencionadamente siguen siendo
  compatibles con hosts OpenClaw más antiguos, mantén el límite mínimo en la API de host más antigua admitida
  y documenta esa elección en la prueba de lanzamiento del Plugin.
- Ejecuta el flujo de trabajo manual `Full Release Validation` antes de la aprobación del lanzamiento para
  iniciar todas las cajas de prueba previas al lanzamiento desde un único punto de entrada. Acepta una rama,
  una etiqueta o un SHA completo de commit, lanza manualmente `CI` y lanza
  `OpenClaw Release Checks` para pruebas rápidas de instalación, aceptación de paquetes, comprobaciones de paquetes
  entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables y completas
  siempre incluyen pruebas exhaustivas en vivo/E2E y una prueba de resistencia de la ruta de lanzamiento Docker;
  `run_release_soak=true` se conserva para una prueba de resistencia beta explícita. Package
  Acceptance proporciona el E2E canónico de Telegram del paquete durante la validación del candidato,
  evitando un segundo sondeador en vivo concurrente.
  Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete npm
  enviado en las comprobaciones de lanzamiento, Package Acceptance y E2E de Telegram
  del paquete sin reconstruir el tarball de lanzamiento. Proporciona
  `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete
  publicado distinto del resto de la validación de lanzamiento. Proporciona
  `package_acceptance_package_spec` cuando Package Acceptance deba usar un
  paquete publicado distinto de la especificación del paquete de lanzamiento. Proporciona
  `evidence_package_spec` cuando el informe de evidencia de lanzamiento deba demostrar que la
  validación coincide con un paquete npm publicado sin forzar E2E de Telegram.
  Ejemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Ejecuta el flujo de trabajo manual `Package Acceptance` cuando quieras pruebas de canal lateral
  para un candidato de paquete mientras continúa el trabajo de lanzamiento. Usa `source=npm` para
  `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento; `source=ref`
  para empaquetar una rama/etiqueta/SHA `package_ref` de confianza con el arnés
  `workflow_ref` actual; `source=url` para un tarball HTTPS público con un
  SHA-256 obligatorio y una política estricta de URL pública; `source=trusted-url` para una
  política de fuente de confianza con nombre que usa `trusted_source_id` y SHA-256 obligatorios; o
  `source=artifact` para un tarball subido por otra ejecución de GitHub Actions. El
  flujo de trabajo resuelve el candidato como
  `package-under-test`, reutiliza el planificador de lanzamiento Docker E2E contra ese
  tarball y puede ejecutar QA de Telegram contra el mismo tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los
  carriles Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto del paquete
  es el candidato y `published_upgrade_survivor_baseline` selecciona
  la base de referencia publicada. `update-restart-auth` usa el paquete candidato como
  CLI instalada y como paquete bajo prueba, de modo que ejercita la
  ruta de reinicio gestionado del comando de actualización del candidato.
  Ejemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red de Gateway y recarga de configuración
  - `package`: carriles nativos de artefacto de paquete/actualización/reinicio/Plugin sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagente,
    búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de ruta de lanzamiento Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una reejecución enfocada
- Ejecuta directamente el flujo de trabajo manual `CI` cuando solo necesites cobertura normal determinista
  de CI para el candidato de lanzamiento. Los lanzamientos manuales de CI omiten el alcance por cambios
  y fuerzan los shards Linux Node, shards de Plugin empaquetados, shards de contratos de Plugin y
  canal, compatibilidad con Node 22, `check-*`, `check-additional-*`,
  comprobaciones rápidas de artefactos construidos, comprobaciones de documentación, Skills de Python, Windows, macOS y
  carriles de i18n de Control UI. Las ejecuciones manuales independientes de CI ejecutan Android solo cuando se lanzan
  con `include_android=true`; `Full Release Validation` pasa esa entrada a
  su hijo de CI.
  Ejemplo con Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Ejecuta `pnpm qa:otel:smoke` al validar telemetría de lanzamiento. Ejercita
  QA-lab mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros
  más atributos de traza acotados y redacción de contenido/identificadores sin
  requerir Opik, Langfuse u otro recolector externo.
- Ejecuta `pnpm qa:otel:collector-smoke` al validar compatibilidad con recolectores.
  Enruta la misma exportación OTLP de QA-lab a través de un contenedor Docker real de OpenTelemetry Collector
  antes de las aserciones del receptor local.
- Ejecuta `pnpm qa:prometheus:smoke` al validar el scraping protegido de Prometheus.
  Ejercita QA-lab, rechaza scrapes no autenticados y verifica que
  las familias de métricas críticas para el lanzamiento sigan libres de contenido de prompts, identificadores sin procesar,
  tokens de autenticación y rutas locales.
- Ejecuta `pnpm qa:observability:smoke` cuando quieras ejecutar consecutivamente los carriles rápidos
  de OpenTelemetry y Prometheus desde el checkout de código fuente.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado
- La comprobación previa de `OpenClaw NPM Release` genera evidencia de lanzamiento de dependencias antes
  de empaquetar el tarball npm. La puerta de vulnerabilidades de avisos npm es
  bloqueante para el lanzamiento. El riesgo del manifiesto transitivo, la superficie de propiedad/instalación
  de dependencias y los informes de cambios de dependencias son solo evidencia de lanzamiento. El
  informe de cambios de dependencias compara el candidato de lanzamiento con la etiqueta de lanzamiento alcanzable
  anterior.
- La comprobación previa sube evidencia de dependencias como
  `openclaw-release-dependency-evidence-<tag>` y también la incrusta bajo
  `dependency-evidence/` dentro del artefacto npm preparado de comprobación previa. La ruta real
  de publicación reutiliza ese artefacto de comprobación previa y luego adjunta la misma evidencia
  al lanzamiento de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación con mutaciones después de que exista la
  etiqueta. Lánzalo desde `release/YYYY.M.PATCH` (o `main` al publicar una
  etiqueta alcanzable desde main), pasa la etiqueta de lanzamiento, el
  `preflight_run_id` exitoso de npm de OpenClaw y el `full_release_validation_run_id` exitoso, y mantén
  el alcance predeterminado de publicación de Plugin `all-publishable` salvo que estés ejecutando deliberadamente
  una reparación enfocada. El flujo de trabajo serializa la publicación npm de Plugin, la publicación
  ClawHub de Plugin y la publicación npm de OpenClaw para que el paquete central no se publique
  antes que sus Plugins externalizados.
- `OpenClaw Release Publish` estable requiere un `windows_node_tag` exacto después de que
  exista el lanzamiento no preliminar correspondiente de `openclaw/openclaw-windows-node`.
  También requiere el mapa `windows_node_installer_digests` aprobado para el candidato.
  Antes de lanzar cualquier hijo de publicación, verifica que el lanzamiento fuente esté
  publicado, no sea preliminar, contenga los instaladores x64/ARM64 requeridos y
  siga coincidiendo con ese mapa aprobado. Luego lanza `Windows Node Release`
  mientras el lanzamiento de OpenClaw aún es un borrador, llevando sin cambios el mapa fijado de resúmenes
  de instaladores. El flujo de trabajo hijo descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta,
  los compara con los resúmenes fijados, verifica que sus firmas Authenticode
  usen el firmante esperado OpenClaw Foundation en un runner Windows,
  escribe un manifiesto SHA-256 y sube los instaladores más el manifiesto al
  lanzamiento canónico de GitHub de OpenClaw, luego vuelve a descargar los recursos promovidos y
  verifica la pertenencia al manifiesto y los hashes. El padre verifica el contrato actual
  de recursos x64, ARM64 y checksum antes de la publicación. La recuperación directa
  rechaza nombres de recurso `OpenClawCompanion-*` inesperados antes de reemplazar los
  recursos esperados del contrato con los bytes fuente fijados. Lanza manualmente
  `Windows Node Release` solo para recuperación, y pasa siempre una etiqueta exacta, nunca
  `latest`, más el mapa JSON explícito `expected_installer_digests` del
  lanzamiento fuente aprobado. Los enlaces de descarga del sitio web deben apuntar a URL exactas de recursos de lanzamiento de OpenClaw
  para el lanzamiento estable actual, o a
  `releases/latest/download/...` solo después de verificar que la redirección latest de GitHub
  apunta a ese mismo lanzamiento; no enlaces solo a la página de lanzamiento del repositorio companion.
- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` también ejecuta el carril de paridad mock de QA Lab más el perfil rápido
  en vivo de Matrix y el carril QA de Telegram antes de la aprobación del lanzamiento. Los carriles en vivo
  usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales
  de Convex CI. Ejecuta el flujo de trabajo manual `QA-Lab - All Lanes` con
  `matrix_profile=all` y `matrix_shards=true` cuando quieras el inventario completo de transporte,
  medios y E2EE de Matrix en paralelo.
- La validación de runtime de instalación y actualización entre sistemas operativos forma parte de los flujos públicos
  `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al
  flujo de trabajo reutilizable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Esta división es intencional: mantiene la ruta real de lanzamiento npm corta,
  determinista y enfocada en artefactos, mientras las comprobaciones en vivo más lentas permanecen en su
  propio carril para que no ralenticen ni bloqueen la publicación
- Las comprobaciones de lanzamiento que contienen secretos deben lanzarse mediante `Full Release
Validation` o desde la referencia de flujo de trabajo `main`/release para que la lógica del flujo de trabajo y
  los secretos permanezcan controlados
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de commit siempre
  que el commit resuelto sea alcanzable desde una rama de OpenClaw o una etiqueta de lanzamiento
- La comprobación previa solo de validación de `OpenClaw NPM Release` también acepta el SHA completo actual
  de 40 caracteres del commit de la rama del flujo de trabajo sin requerir una etiqueta publicada
- Esa ruta SHA es solo de validación y no puede promocionarse a una publicación real
- En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la
  comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en runners hospedados por GitHub,
  mientras que la ruta de validación sin mutaciones puede usar los runners Linux Blacksmith
  más grandes
- Ese flujo de trabajo ejecuta
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`
- La comprobación previa de lanzamiento npm ya no espera al carril separado de comprobaciones de lanzamiento
- Antes de etiquetar localmente un candidato de lanzamiento, ejecuta
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El helper
  ejecuta las protecciones rápidas de lanzamiento, comprobaciones de lanzamiento npm/ClawHub de Plugin, build,
  build de UI y `release:openclaw:npm:check` en el orden que detecta errores comunes
  bloqueantes de aprobación antes de que empiece el flujo de trabajo de publicación de GitHub.
- Ejecuta `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (o la etiqueta beta/corrección correspondiente) antes de la aprobación
- Después de publicar en npm, ejecuta
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (o la versión beta/corrección correspondiente) para verificar la ruta de
  instalación del registro publicado en un prefijo temporal nuevo
- Después de publicar una beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar la incorporación del paquete instalado, la configuración de Telegram y el E2E real de Telegram
  contra el paquete npm publicado usando el grupo compartido de credenciales de Telegram arrendadas.
  Las ejecuciones puntuales locales de mantenedores pueden omitir las variables de Convex y pasar directamente las tres
  credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar el smoke beta completo posterior a la publicación desde una máquina de mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El helper ejecuta la validación de actualización npm/fresh-target en Parallels, lanza `NPM Telegram Beta E2E`, sondea la ejecución exacta del workflow, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el
  workflow manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y
  no se ejecuta en cada merge.
- La automatización de releases de mantenedor ahora usa preflight-then-promote:
  - la publicación npm real debe pasar un `preflight_run_id` de npm exitoso
  - la publicación npm real debe lanzarse desde la misma rama `main` o
    `release/YYYY.M.PATCH` que la ejecución de preflight exitosa
  - las releases npm estables usan `beta` de forma predeterminada
  - la publicación npm estable puede apuntar explícitamente a `latest` mediante la entrada del workflow
  - la mutación de dist-tag de npm basada en token ahora vive en
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque
    `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio fuente mantiene
    publicación solo con OIDC
  - `macOS Release` público es solo de validación; cuando una etiqueta vive solo en una
    rama de release pero el workflow se lanza desde `main`, establece
    `public_release_branch=release/YYYY.M.PATCH`
  - la publicación real de macOS debe pasar un `preflight_run_id` y un
    `validate_run_id` de macOS exitosos
  - las rutas de publicación reales promocionan artefactos preparados en lugar de volver a compilarlos
- Para releases estables de corrección como `YYYY.M.PATCH-N`, el verificador posterior a la publicación
  también comprueba la misma ruta de actualización con prefijo temporal de `YYYY.M.PATCH` a `YYYY.M.PATCH-N`
  para que las correcciones de release no puedan dejar silenciosamente las instalaciones globales antiguas en la
  carga útil estable base
- El preflight de release npm falla de forma cerrada salvo que el tarball incluya tanto
  `dist/control-ui/index.html` como una carga útil no vacía de `dist/control-ui/assets/`
  para que no volvamos a distribuir un panel de navegador vacío
- La verificación posterior a la publicación también comprueba que los entrypoints de Plugin publicados y
  los metadatos del paquete estén presentes en el diseño de registro instalado. Una release que
  distribuya cargas útiles de runtime de Plugin faltantes falla el verificador posterior a la publicación y
  no puede promocionarse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` de npm pack al
  tarball candidato de actualización, de modo que el e2e del instalador detecte bloat accidental del paquete
  antes de la ruta de publicación de la release
- Si el trabajo de release tocó la planificación de CI, manifiestos de tiempos de plugins o
  matrices de pruebas de plugins, regenera y revisa las salidas de matriz
  `plugin-prerelease-extension-shard` propiedad del planificador desde
  `.github/workflows/plugin-prerelease.yml` antes de la aprobación, para que las notas de release no
  describan un diseño de CI obsoleto
- La preparación de la release estable de macOS también incluye las superficies del actualizador:
  - la release de GitHub debe terminar con los `.zip`, `.dmg` y `.dSYM.zip` empaquetados
  - `appcast.xml` en `main` debe apuntar al nuevo zip estable después de publicar; el
    workflow de publicación de macOS lo confirma automáticamente, o abre un PR de appcast
    cuando el push directo está bloqueado
  - la app empaquetada debe mantener un bundle id que no sea de depuración, una URL de feed de Sparkle
    no vacía y un `CFBundleVersion` igual o superior al mínimo canónico de build de Sparkle
    para esa versión de release

## Cajas de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician todas las pruebas previas al lanzamiento desde
un único punto de entrada. Para una prueba de confirmación fijada en una rama que avanza rápido, usa el
helper para que cada flujo de trabajo hijo se ejecute desde una rama temporal fijada al
SHA objetivo:

```bash
pnpm ci:full-release --sha <full-sha>
```

El helper sube `release-ci/<sha>-...`, despacha `Full Release Validation`
desde esa rama con `ref=<sha>`, verifica que cada `headSha` de flujo de trabajo hijo
coincida con el objetivo y luego elimina la rama temporal. Esto evita probar por accidente una
ejecución hija de `main` más reciente.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo de trabajo
`main` de confianza y pasa la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

El flujo de trabajo resuelve la referencia objetivo, despacha manualmente `CI` con
`target_ref=<release-ref>` y luego despacha `OpenClaw Release Checks`.
`OpenClaw Release Checks` distribuye comprobaciones de instalación smoke, comprobaciones de lanzamiento
entre sistemas operativos, cobertura live/E2E de la ruta de lanzamiento de Docker cuando soak está habilitado, Package Acceptance
con el E2E canónico del paquete de Telegram, paridad de QA Lab, Matrix en vivo y
Telegram en vivo. Una ejecución completa/all solo es aceptable cuando el resumen de
`Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como
correctos, a menos que una repetición enfocada haya omitido intencionalmente el hijo separado de `Plugin
Prerelease`. Usa el hijo independiente `npm-telegram` solo para una repetición enfocada
de paquete publicado con `release_package_spec` o
`npm_telegram_package_spec`. El resumen final del
verificador incluye tablas de trabajos más lentos para cada ejecución hija, de modo que el responsable del lanzamiento
pueda ver la ruta crítica actual sin descargar logs.
Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para ver la
matriz completa de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias entre perfiles stable y full,
artefactos y manejadores de repetición enfocada.
Los flujos de trabajo hijos se despachan desde la referencia de confianza que ejecuta `Full Release
Validation`, normalmente `--ref main`, incluso cuando la `ref` objetivo apunta a una
rama o etiqueta de lanzamiento anterior. No hay una entrada separada de referencia de flujo de trabajo de Full Release Validation;
elige el arnés de confianza eligiendo la referencia de ejecución del flujo de trabajo.
No uses `--ref main -f ref=<sha>` para prueba exacta de confirmación en `main` en movimiento;
los SHA de confirmación sin procesar no pueden ser referencias de despacho de flujo de trabajo, así que usa
`pnpm ci:full-release --sha <sha>` para crear la rama temporal fijada.

Usa `release_profile` para seleccionar la amplitud live/proveedor:

- `minimum`: ruta live y Docker crítica de lanzamiento más rápida de OpenAI/core
- `stable`: minimum más cobertura estable de proveedor/backend para aprobación de lanzamiento
- `full`: stable más cobertura amplia consultiva de proveedor/medios

La validación stable y full siempre ejecuta el barrido exhaustivo live/E2E, de ruta de lanzamiento de Docker
y acotado de supervivencia de actualización publicada antes de la promoción.
Usa `run_release_soak=true` para solicitar ese mismo barrido para una beta. Ese barrido cubre
los últimos cuatro paquetes stable más las líneas base fijadas `2026.4.23` y `2026.5.2`
más cobertura anterior de `2026.4.15`, con líneas base duplicadas eliminadas y
cada línea base fragmentada en su propio trabajo runner de Docker.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver la referencia objetivo
una vez como `release-package-under-test` y reutiliza ese artefacto en comprobaciones entre sistemas operativos,
Package Acceptance y Docker de ruta de lanzamiento cuando se ejecuta soak. Esto mantiene
todas las cajas orientadas a paquetes sobre los mismos bytes y evita compilaciones repetidas de paquetes.
Después de que una beta ya esté en npm, establece `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
para que las comprobaciones de lanzamiento descarguen una vez el paquete publicado, extraigan su SHA de origen de compilación
de `dist/build-info.json` y reutilicen ese artefacto para carriles entre sistemas operativos,
Package Acceptance, Docker de ruta de lanzamiento y Telegram de paquete.
La comprobación smoke de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la
variable del repo/org está establecida; de lo contrario, usa `openai/gpt-5.4`, porque este carril está
probando la instalación del paquete, onboarding, inicio del Gateway y un turno de agente en vivo,
no comparando el modelo predeterminado más lento. La matriz más amplia de proveedores en vivo
sigue siendo el lugar para cobertura específica por modelo.

Usa estas variantes según la etapa de lanzamiento:

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

No uses el paraguas completo como primera repetición después de una corrección enfocada. Si una caja
falla, usa el flujo de trabajo hijo, trabajo, carril de Docker, perfil de paquete, proveedor de modelo
o carril de QA fallido para la siguiente prueba. Ejecuta de nuevo el paraguas completo solo cuando
la corrección haya cambiado la orquestación compartida del lanzamiento o haya dejado obsoleta la evidencia previa
de todas las cajas. El verificador final del paraguas vuelve a comprobar los ids registrados de ejecución de flujos de trabajo hijos,
así que después de repetir correctamente un flujo de trabajo hijo, repite solo el trabajo padre fallido
`Verify full validation`.

Para recuperación acotada, pasa `rerun_group` al paraguas. `all` es la ejecución real
del candidato de lanzamiento, `ci` ejecuta solo el hijo de CI normal, `plugin-prerelease`
ejecuta solo el hijo de Plugin exclusivo de lanzamiento, `release-checks` ejecuta todas las cajas
de lanzamiento, y los grupos de lanzamiento más estrechos son `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`.
Las repeticiones enfocadas de `npm-telegram` requieren `release_package_spec` o
`npm_telegram_package_spec`; las ejecuciones full/all usan el E2E canónico de Telegram de paquete
dentro de Package Acceptance. Las repeticiones enfocadas
entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u
otro filtro de sistema operativo/suite. Los fallos de release-check de QA bloquean la validación normal
de lanzamiento, incluida la deriva requerida de herramientas dinámicas de OpenClaw en el nivel estándar.
Las ejecuciones alpha de Tideclaw aún pueden tratar los carriles release-check que no son de seguridad de paquete como
consultivos. Cuando `live_suite_filter` solicita explícitamente un carril QA live protegido, como
Discord, WhatsApp o Slack, la variable de repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente debe estar habilitada; de lo contrario,
la captura de entrada falla en lugar de omitir silenciosamente el carril.

### Vitest

La caja de Vitest es el flujo de trabajo hijo manual `CI`. CI manual omite intencionalmente
el alcance por cambios y fuerza el grafo normal de pruebas para el candidato de lanzamiento:
fragmentos de Linux Node, fragmentos de plugins incluidos, fragmentos de contrato de Plugin y canal,
compatibilidad con Node 22, `check-*`, `check-additional-*`,
comprobaciones smoke de artefactos compilados, comprobaciones de docs, Skills de Python, Windows, macOS
y i18n de Control UI. Android se incluye cuando `Full Release Validation` ejecuta la
caja porque el paraguas pasa `include_android=true`; CI manual independiente
requiere `include_android=true` para cobertura de Android.

Usa esta caja para responder "¿pasó el árbol de código fuente toda la suite normal de pruebas?"
No es lo mismo que la validación de producto de ruta de lanzamiento. Evidencia que conservar:

- Resumen de `Full Release Validation` que muestra la URL de ejecución de `CI` despachada
- Ejecución de `CI` verde en el SHA objetivo exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest como `.artifacts/vitest-shard-timings.json` cuando
  una ejecución necesita análisis de rendimiento

Ejecuta CI manual directamente solo cuando el lanzamiento necesita CI normal determinista, pero
no las cajas de Docker, QA Lab, live, entre sistemas operativos o paquete. Usa el primer comando
para CI directa sin Android. Añade `include_android=true` cuando la CI directa
del candidato de lanzamiento deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La caja de Docker vive en `OpenClaw Release Checks` mediante
`openclaw-live-and-e2e-checks-reusable.yml`, más el flujo de trabajo `install-smoke`
en modo de lanzamiento. Valida el candidato de lanzamiento mediante entornos Docker
empaquetados en lugar de solo pruebas a nivel de código fuente.

La cobertura Docker de lanzamiento incluye:

- comprobación smoke completa de instalación con la comprobación smoke de instalación global lenta de Bun habilitada
- preparación/reutilización de imagen smoke del Dockerfile raíz por SHA objetivo, con trabajos smoke de QR,
  root/gateway e installer/Bun ejecutándose como fragmentos install-smoke separados
- carriles E2E del repositorio
- fragmentos Docker de ruta de lanzamiento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` y `plugins-runtime-install-h`
- cobertura de OpenWebUI dentro del fragmento `plugins-runtime-services` cuando se solicita
- carriles divididos de instalación/desinstalación de plugins incluidos
  `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suites live/E2E de proveedores y cobertura de modelo live de Docker cuando las comprobaciones de lanzamiento
  incluyen suites live

Usa los artefactos de Docker antes de repetir. El planificador de ruta de lanzamiento sube
`.artifacts/docker-tests/` con logs de carril, `summary.json`, `failures.json`,
tiempos de fases, JSON del plan del planificador y comandos de repetición. Para recuperación enfocada,
usa `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable live/E2E en lugar de
repetir todos los fragmentos de lanzamiento. Los comandos de repetición generados incluyen
`package_artifact_run_id` previo y entradas de imagen Docker preparadas cuando están disponibles, para que un
carril fallido pueda reutilizar el mismo tarball e imágenes GHCR.

### QA Lab

La caja de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento
de comportamiento agéntico y a nivel de canal, separada de Vitest y de la mecánica de paquetes
de Docker.

La cobertura de QA Lab de lanzamiento incluye:

- carril de paridad mock que compara el carril candidato de OpenAI con la línea base Opus 4.6
  usando el paquete de paridad agéntica
- perfil rápido de QA de Matrix en vivo usando el entorno `qa-live-shared`
- carril QA de Telegram en vivo usando arriendos de credenciales CI de Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` o
  `pnpm qa:observability:smoke` cuando la telemetría de lanzamiento necesita prueba local explícita

Usa esta caja para responder "¿se comporta correctamente el lanzamiento en escenarios de QA y
flujos de canales en vivo?" Conserva las URL de artefactos para los carriles de paridad, Matrix y Telegram
al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una
ejecución manual fragmentada de QA-Lab en lugar del carril crítico de lanzamiento predeterminado.

### Paquete

La caja de Paquete es la puerta del producto instalable. Está respaldada por
`Package Acceptance` y el resolutor
`scripts/resolve-openclaw-package-candidate.mjs`. El resolutor normaliza un
candidato en el tarball `package-under-test` consumido por Docker E2E, valida
el inventario del paquete, registra la versión del paquete y SHA-256, y mantiene la
referencia del arnés del flujo de trabajo separada de la referencia de origen del paquete.

Fuentes de candidato admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta
  de una release de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA completo de commit de
  `package_ref` de confianza con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS público con `package_sha256`
  requerido; se rechazan las credenciales de URL, los puertos HTTPS no
  predeterminados, los nombres de host o direcciones resueltas
  privadas/internas/de uso especial, y las redirecciones inseguras
- `source=trusted-url`: descarga un `.tgz` HTTPS con `package_sha256` y
  `trusted_source_id` requeridos desde una política con nombre en
  `.github/package-trusted-sources.json`; usa esto para réplicas empresariales
  propiedad de mantenedores o repositorios de paquetes privados, en lugar de
  agregar una omisión de red privada a nivel de entrada para `source=url`
- `source=artifact`: reutiliza un `.tgz` subido por otra ejecución de
  GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el
artefacto de paquete de release preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la
actualización, el reinicio de actualización de autenticación configurada, la
instalación de skill de ClawHub en vivo, la limpieza de dependencias obsoletas de plugins, fixtures de
plugins sin conexión, actualización de plugins y QA de paquete de Telegram
contra el mismo tarball resuelto. Las comprobaciones de release bloqueantes usan
la línea base predeterminada del paquete publicado más reciente; el perfil beta
con `run_release_soak=true`, `release_profile=stable` o `release_profile=full`
se expande a cada línea base estable publicada en npm desde `2026.4.23` hasta
`latest`, además de fixtures de issues reportados. Usa Package Acceptance con
`source=npm` para un candidato ya enviado, `source=ref` para un tarball npm local
respaldado por SHA antes de publicar, `source=trusted-url` para una réplica
empresarial/privada propiedad de mantenedores, o `source=artifact` para un
tarball preparado subido por otra ejecución de GitHub Actions. Es el reemplazo
nativo de GitHub para la mayor parte de la cobertura de paquete/actualización
que antes requería Parallels. Las comprobaciones de release entre sistemas
operativos siguen siendo importantes para el onboarding específico del sistema
operativo, el instalador y el comportamiento de plataforma, pero la validación
de producto de paquete/actualización debería preferir Package Acceptance.

La lista de verificación canónica para validación de actualizaciones y plugins es
[Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Úsala
al decidir qué carril local, de Docker, de Package Acceptance o de comprobación
de release prueba una instalación/actualización de plugin, una limpieza de
doctor o un cambio de migración de paquete publicado. La migración exhaustiva de
actualización publicada desde cada paquete estable `2026.4.23+` es un workflow
manual separado de `Update Migration`, no parte de Full Release CI.

La tolerancia heredada de package-acceptance está intencionalmente limitada en
el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad
para brechas de metadatos ya publicadas en npm: entradas privadas de inventario
de QA ausentes del tarball, `gateway install --wrapper` ausente, archivos de
parche ausentes en el fixture git derivado del tarball, `update.channel`
persistido ausente, ubicaciones heredadas de registros de instalación de
plugins, persistencia ausente de registros de instalación del marketplace y
migración de metadatos de configuración durante `plugins update`. El paquete
publicado `2026.4.26` puede advertir por archivos locales de sello de metadatos
de build que ya se enviaron. Los paquetes posteriores deben satisfacer los
contratos modernos de paquete; esas mismas brechas fallan la validación de
release.

Usa perfiles más amplios de Package Acceptance cuando la pregunta de release
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
- `package`: contratos de paquete de instalación/actualización/reinicio/plugin
  más prueba de instalación de skill de ClawHub en vivo; este es el valor
  predeterminado de comprobación de release
- `product`: `package` más canales MCP, limpieza de cron/subagente, búsqueda web
  de OpenAI y OpenWebUI
- `full`: fragmentos de ruta de release de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para prueba de Telegram de candidato de paquete, habilita
`telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package
Acceptance. El workflow pasa el tarball `package-under-test` resuelto al carril
de Telegram; el workflow independiente de Telegram todavía acepta una
especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de release

`OpenClaw Release Publish` es el punto de entrada mutante normal de publicación.
Orquesta los workflows de publicador de confianza en el orden que necesita la
release:

1. Hacer checkout de la etiqueta de release y resolver su SHA de commit.
2. Verificar que la etiqueta sea alcanzable desde `main` o `release/*`.
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y
   `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de release, la dist-tag de
   npm y el `preflight_run_id` guardado después de verificar el
   `full_release_validation_run_id` guardado.
7. Para releases estables, crear o actualizar la release de GitHub como borrador,
   despachar `Windows Node Release` con el `windows_node_tag` explícito y los
   `windows_node_installer_digests` aprobados por el candidato, y verificar los
   activos canónicos de instalador/suma de comprobación antes de publicar el
   borrador.

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

Usa los workflows de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release`
solo para trabajos enfocados de reparación o republicación. `OpenClaw Release Publish`
rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true` para
que el paquete core no pueda enviarse sin cada plugin oficial publicable,
incluido `@openclaw/diffs-language-pack`. Para una reparación de plugin
seleccionado, configura `publish_openclaw_npm=false` con
`plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despacha el
workflow hijo directamente.

## Entradas del workflow NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de release requerida como `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; cuando `preflight_only=true`, también puede ser el SHA
  completo de commit de 40 caracteres de la rama de workflow actual para
  preflight solo de validación
- `preflight_only`: `true` solo para validación/build/paquete, `false` para la
  ruta de publicación real
- `preflight_run_id`: requerido en la ruta de publicación real para que el
  workflow reutilice el tarball preparado de la ejecución de preflight exitosa
- `npm_dist_tag`: etiqueta objetivo de npm para la ruta de publicación; el valor
  predeterminado es `beta`

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de release requerida; ya debe existir
- `preflight_run_id`: id de ejecución de preflight exitosa de
  `OpenClaw NPM Release`; requerido cuando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id de ejecución exitosa de
  `Full Release Validation`; requerido cuando `publish_openclaw_npm=true`
- `windows_node_tag`: etiqueta de release exacta no prerelease de
  `openclaw/openclaw-windows-node`; requerida para publicación estable de
  OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado por el candidato
  de los nombres actuales de instaladores de Windows a sus resúmenes
  `sha256:` fijados; requerido para publicación estable de OpenClaw
- `npm_dist_tag`: etiqueta objetivo de npm para el paquete OpenClaw
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; usa
  `selected` solo para trabajos enfocados de reparación solo de plugins con
  `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; configúralo en
  `false` solo cuando uses el workflow como orquestador de reparación solo de
  plugins
- `wait_for_clawhub`: el valor predeterminado es `false` para que la
  disponibilidad de npm no quede bloqueada por el sidecar de ClawHub; configúralo
  en `true` solo cuando la finalización del workflow deba incluir la finalización
  de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo de commit que validar. Las comprobaciones
  con secretos requieren que el commit resuelto sea alcanzable desde una rama de
  OpenClaw o una etiqueta de release.
- `run_release_soak`: optar por soak exhaustivo en vivo/E2E, ruta de release de
  Docker y upgrade-survivor desde todas las versiones para comprobaciones de
  release beta. Se fuerza con `release_profile=stable` y `release_profile=full`.

Reglas:

- Las etiquetas estables y de corrección pueden publicar en `beta` o `latest`
- Las etiquetas prerelease beta solo pueden publicar en `beta`
- Para `OpenClaw NPM Release`, la entrada de SHA completo de commit solo se
  permite cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son solo de
  validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` usado durante
  preflight; el workflow verifica que los metadatos antes de publicar sigan
  coincidiendo

## Secuencia de release npm estable

Al preparar una release npm estable:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`
   - Antes de que exista una etiqueta, puedes usar el SHA completo actual del commit de la rama del workflow
     para una ejecución de ensayo solo de validación del workflow de preflight
2. Elige `npm_dist_tag=beta` para el flujo normal que empieza por beta, o `latest` solo
   cuando quieras intencionadamente una publicación estable directa
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA completo
   del commit cuando quieras CI normal más cobertura de caché de prompts en vivo, Docker, QA Lab,
   Matrix y Telegram desde un único workflow manual
4. Si intencionadamente solo necesitas el grafo determinista normal de pruebas, ejecuta en su lugar el
   workflow manual `CI` en la referencia de lanzamiento
5. Selecciona la etiqueta de lanzamiento exacta no preliminar `openclaw/openclaw-windows-node`
   cuyos instaladores x64 y ARM64 firmados deben publicarse. Guárdala como
   `windows_node_tag`, y guarda su mapa de resúmenes validado como
   `windows_node_installer_digests`. El asistente de candidato de lanzamiento registra ambos
   y los incluye en su comando de publicación generado.
6. Guarda los `preflight_run_id` y `full_release_validation_run_id` correctos
7. Ejecuta `OpenClaw Release Publish` con la misma `tag`, el mismo `npm_dist_tag`,
   el `windows_node_tag` seleccionado, sus `windows_node_installer_digests` guardados,
   el `preflight_run_id` guardado y el `full_release_validation_run_id` guardado;
   publica los plugins externalizados en npm y ClawHub antes de promocionar el
   paquete npm de OpenClaw
8. Si el lanzamiento llegó a `beta`, usa el workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   para promocionar esa versión estable de `beta` a `latest`
9. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta`
   debe seguir la misma compilación estable de inmediato, usa ese mismo workflow de lanzamiento
   para apuntar ambos dist-tags a la versión estable, o deja que su sincronización programada
   de autorreparación mueva `beta` más tarde

La mutación de dist-tag vive en el repositorio del libro mayor de lanzamientos porque todavía requiere
`NPM_TOKEN`, mientras que el repositorio fuente conserva la publicación solo con OIDC.

Eso mantiene tanto la ruta de publicación directa como la ruta de promoción que empieza por beta
documentadas y visibles para el operador.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecuta cualquier comando de la
CLI de 1Password (`op`) solo dentro de una sesión dedicada de tmux. No llames a `op`
directamente desde el shell principal del agente; mantenerlo dentro de tmux hace que los prompts,
las alertas y la gestión de OTP sean observables y evita alertas repetidas del host.

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
