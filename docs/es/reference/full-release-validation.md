---
read_when:
    - Ejecución o repetición de la validación completa de la versión
    - Comparación de los perfiles de validación de versiones estables y completas
    - Depuración de fallos en las etapas de validación de versiones
summary: Etapas de Validación completa de la versión, flujos de trabajo secundarios, perfiles de versión, mecanismos de repetición y evidencias
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-07-19T02:25:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ec027e633efb118c7fbad8b2cd2a17408c2ba46e0c0742a180b1019e21731174
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el marco general de validación del producto para la versión. La mayor parte del trabajo
se realiza en flujos de trabajo secundarios, de modo que se pueda volver a ejecutar una máquina con errores sin reiniciar
toda la versión. Ejecute la preparación de la versión antes de fijar el SHA del código; esta
actualiza la salida de configuración regional de Control UI cuando el bot en segundo plano aún no la ha
integrado y, a continuación, aplica la misma comprobación estricta de cero mecanismos alternativos que utiliza la CI de la versión.

Fije el commit previo al registro de cambios que contiene el producto completo como el **SHA del código** y, a continuación, ejecute:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` también acepta `anthropic` o `minimax` para la incorporación multiplataforma y el
turno de agente de extremo a extremo. El asistente infiere el perfil `beta` de las versiones alfa/beta
del paquete y `stable` en los demás casos. Pase entradas alternativas del flujo de trabajo mediante
`-f key=value`; use `-f release_profile=full` únicamente para el análisis exhaustivo general de avisos.

El asistente crea una referencia temporal `release-ci/*` fijada a un único SHA de flujo de trabajo
`origin/main` de confianza, pasa el SHA de destino únicamente como `ref` candidato
y elimina la referencia temporal después de la validación. Cada flujo secundario iniciado debe
informar de ese mismo SHA de flujo de trabajo. Pase
`-f reuse_evidence=false` para forzar una ejecución nueva o
`--workflow-sha <trusted-main-sha>` para seleccionar un commit anterior del flujo de trabajo que aún sea
accesible desde `origin/main` actual. El propio flujo de trabajo nunca crea ni actualiza
referencias del repositorio.

Cuando el SHA del código esté correcto, genere y confirme únicamente `CHANGELOG.md`. Este nuevo
commit es el **SHA de la versión**. Ejecute el mismo asistente para el SHA de la versión. La evidencia
del producto solo se reutiliza cuando GitHub demuestra que el SHA de la versión desciende del
SHA del código y que el conjunto completo de rutas modificadas es exactamente `CHANGELOG.md`; la
comprobación preliminar de npm y la aceptación de paquetes/instalación se siguen ejecutando en el SHA de la versión.

`release_profile=stable` y `release_profile=full` siempre ejecutan la prueba exhaustiva prolongada
en vivo/Docker. Pase `run_release_soak=true` para incluir las mismas vías de prueba prolongada
con el perfil `beta`. La publicación estable rechaza un manifiesto de validación
que no incluya esta prueba prolongada ni evidencia bloqueante del rendimiento del producto.

La aceptación de paquetes normalmente compila el tarball candidato desde
`ref` resuelto, incluidas las ejecuciones con SHA completo iniciadas mediante `pnpm ci:full-release`. Después de una
publicación beta, pase `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar
el paquete npm publicado en las comprobaciones de la versión, la aceptación de paquetes, las pruebas
multiplataforma, Docker de la ruta de versión y Telegram del paquete. Use `package_acceptance_package_spec`
únicamente cuando la aceptación de paquetes deba demostrar intencionadamente un paquete diferente.
La vía de paquete en vivo del Plugin de Codex sigue el mismo estado: los valores publicados de
`release_package_spec` derivan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
las ejecuciones de SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada; y los operadores
pueden establecer `codex_plugin_spec` directamente para fuentes de Plugin
`npm:`, `npm-pack:` o `git:`. La vía concede la aprobación explícita de instalación de Codex CLI requerida por
ese Plugin y, a continuación, ejecuta la comprobación preliminar de Codex CLI y turnos del agente de OpenAI en la misma sesión.
Su turno final sin reintentos y con razonamiento medio envía progreso visible omitiendo
`final` de Codex, lee entradas aleatorias del espacio de trabajo, escribe su artefacto exacto
y envía una finalización explícita. Esto detecta la regresión de v2026.7.1 en la que un
envío de progreso normal terminaba el turno.

## Etapas de nivel superior

Para `rerun_group=all`, primero se ejecuta un trabajo
`Check for reusable validation evidence`. Busca la validación completa correcta más reciente que tenga el mismo
perfil de versión, la misma configuración efectiva de prueba prolongada y las mismas entradas de validación. Las repeticiones del destino exacto usan
`exact-target-full-validation-v1`. Un descendiente cuyo delta completo sea exactamente
`CHANGELOG.md` usa `changelog-only-release-v1`; se omiten todas las vías del producto
y el verificador vuelve a comprobar de forma independiente la comparación de commits de GitHub, el
artefacto principal inmutable, las ejecuciones secundarias y los registros de inicio. Cualquier otro cambio de destino requiere
una validación nueva del SHA del código. Pase `reuse_evidence=false` para forzar una ejecución completa
nueva. La reutilización de evidencia solo se ejecuta desde `main` o desde una referencia canónica
`release-ci/*` fijada mediante SHA cuyo commit de flujo de trabajo permanezca en el linaje de confianza de `main`;
las demás referencias de flujo de trabajo ejecutan de nuevo las vías seleccionadas.

La validación nueva orientada a paquetes prepara un tarball inmutable y un artefacto de imagen
Docker antes de iniciar la prepublicación de Plugins y las comprobaciones de versión de OpenClaw.
Ambos flujos secundarios verifican el mismo SHA de paquete, los identificadores de artefactos, los resúmenes
de servicios, el intento de ejecución del productor y el resumen del archivo Docker antes de utilizarlos. La capa de Docker
básica independiente del paquete usa una caché GHCR direccionada por contenido; las imágenes específicas
del candidato permanecen como artefactos inmutables de GitHub. Las ejecuciones específicas con una especificación explícita
de paquete publicado conservan en su lugar la ruta existente del paquete.

También para `rerun_group=all`, un trabajo `Verify Docker runtime image assets` compila
el destino de Docker `runtime-assets` con
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Se ejecuta en paralelo con las
demás etapas y el verificador general exige su cumplimiento; las vías ya no esperan a que
termine antes de iniciarse. Un `rerun_group` más limitado omite esta comprobación preliminar.

| Etapa                            | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Resolución del destino           | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama, etiqueta o SHA de commit completo de la versión y registra las entradas seleccionadas.<br />**Repetición:** vuelva a ejecutar el marco general si esto falla.                                                                                                                                                                                                                                                        |
| Candidato compartido             | **Trabajo:** `Prepare shared release candidate`<br />**Flujo de trabajo secundario:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Demuestra:** empaqueta y valida un paquete de SHA exacto, crea una imagen Docker funcional y registra tuplas inmutables de artefactos de paquete e imagen para ambos flujos de trabajo secundarios orientados a paquetes.<br />**Repetición:** vuelva a ejecutar el grupo afectado de paquete, prepublicación de Plugins, multiplataforma o en vivo/E2E.                                                                                      |
| Comprobación de recursos Docker  | **Trabajo:** `Verify Docker runtime image assets`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** el destino de compilación de Docker `runtime-assets` sigue completándose correctamente antes de que se inicie cualquier otra etapa. Solo se ejecuta para `rerun_group=all`.<br />**Repetición:** vuelva a ejecutar el marco general con `rerun_group=all`.                                                                                                                                                                                |
| Vitest y CI normal               | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** el grafo manual completo de CI con la referencia de destino, incluidas las vías de Linux Node, los fragmentos de Plugins incluidos, los fragmentos de contratos de Plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS, la i18n de Control UI y Android mediante el marco general.<br />**Repetición:** `rerun_group=ci`. |
| Prepublicación de Plugins        | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de Plugins exclusivas de la versión, cobertura agéntica de Plugins, fragmentos completos de lotes de Plugins, vías de Docker de prepublicación de Plugins y un artefacto `plugin-inspector-advisory` no bloqueante para el triaje de compatibilidad.<br />**Repetición:** `rerun_group=plugin-prerelease`.                                                                                                                             |
| Comprobaciones de la versión     | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** prueba rápida de instalación, comprobaciones de paquetes multiplataforma, aceptación de paquetes, paridad de QA Lab, Matrix y Telegram en vivo, además de vías consultivas con compuerta para Discord, WhatsApp y Slack. Los perfiles estable y completo también ejecutan suites exhaustivas en vivo/E2E y fragmentos de Docker de la ruta de versión; beta puede incluirlos mediante `run_release_soak=true`.<br />**Repetición:** `rerun_group=release-checks` o un identificador más limitado de comprobaciones de versión. |
| Telegram del paquete             | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** una prueba E2E específica de Telegram con el paquete publicado cuando se establece `release_package_spec` o `npm_telegram_package_spec`. La validación completa del candidato usa en su lugar la prueba E2E canónica de Telegram de la aceptación de paquetes.<br />**Repetición:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                                                                                                       |
| Rendimiento del producto         | **Trabajo:** `Run product performance evidence`<br />**Flujo de trabajo secundario:** `OpenClaw Performance`<br />**Demuestra:** ejecución de rendimiento del perfil de versión (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) con el SHA de destino. La salida de Kova permanece en los artefactos del flujo de trabajo y el flujo secundario debe demostrar que se omitió su publicador de informes. Es obligatoria (bloqueante) solo para `rerun_group=all` o `rerun_group=performance`; no es obligatoria para grupos de repetición más limitados.<br />**Repetición:** `rerun_group=performance`. |
| Verificador general              | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y añade tablas de los trabajos más lentos de los flujos de trabajo secundarios.<br />**Repetición:** vuelva a ejecutar únicamente este trabajo después de repetir un flujo secundario fallido hasta que sea correcto.                                                                                                                                                                                                |

El marco general siempre inicia el rendimiento del producto en modo de solo artefactos.
`OpenClaw Performance` permite publicar informes únicamente en ejecuciones programadas o en un
inicio manual que establezca explícitamente `publish_reports=true`. La protección de solo
artefactos debe completarse correctamente, lo que demuestra que el trabajo de publicación permaneció omitido.
La evidencia nueva y reutilizada registra
`controls.performanceReportPublication=artifact-only`; el verificador y el selector de reutilización
rechazan la evidencia que no tenga la prueba secundaria normalizada de rendimiento correspondiente.

El verificador carga el manifiesto canónico como
`full-release-validation-<run-id>-<run-attempt>`. Las herramientas de evidencia validan
su identificador de artefacto, resumen, ejecución productora e intento antes de descargar ese
identificador exacto de artefacto. Limitan el ZIP descargado, verifican sus bytes con el resumen
`sha256:` de REST y transmiten la única entrada de manifiesto limitada permitida sin
extraer el archivo. Se mantiene temporalmente un alias de nombre estable para consumidores
de publicación anteriores. El verificador siempre prefiere el artefacto calificado por intento;
como transición, solo acepta el nombre estable para un productor de manifiesto v2
del intento 1. Rechaza ese nombre heredado para intentos posteriores y para el manifiesto v3.

Para `ref=main` con `rerun_group=all`, para las referencias `release/*` y para las referencias alfa de Tideclaw, una ejecución coordinadora más reciente sustituye a una anterior con la misma referencia y el mismo grupo de reejecución. Cuando se cancela la ejecución principal, su monitor cancela cualquier flujo de trabajo secundario que ya haya lanzado. Las ejecuciones de validación de etiquetas y de SHA fijados no se cancelan entre sí.

## Etapas de las comprobaciones de la versión

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el objetivo una sola vez y valida el artefacto de paquete compartido de la ejecución coordinadora cuando está disponible. Un lanzamiento directo o específico prepara su propio artefacto `release-package-under-test` cuando lo necesitan las etapas relacionadas con paquetes o Docker.

| Etapa                    | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de la versión           | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro específico del conjunto de pruebas en vivo.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artefacto de paquete         | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** valida la tupla inmutable de paquetes de la ejecución coordinadora o empaqueta un archivo tar candidato para un lanzamiento directo o específico de las comprobaciones de la versión y, después, lo pone a disposición de las comprobaciones posteriores relacionadas con paquetes.<br />**Reejecución:** el grupo afectado de paquetes, multiplataforma o en vivo/E2E.                                                                                                                                                                                                                                |
| Prueba rápida de instalación            | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo subyacente:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de la imagen de prueba rápida del Dockerfile raíz, instalación del paquete mediante QR, pruebas rápidas de Docker para la raíz y el Gateway, pruebas del instalador en Docker y prueba rápida del proveedor de imágenes con instalación global mediante Bun.<br />**Reejecución:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Multiplataforma                 | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo subyacente:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** canales de instalación nueva y actualización en Linux, Windows y macOS para el proveedor y el modo seleccionados, mediante el archivo tar candidato y un paquete de referencia.<br />**Reejecución:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E del repositorio y en vivo        | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E del repositorio, caché en vivo, transmisión por websocket de OpenAI, particiones nativas de proveedores y plugins en vivo, y entornos de pruebas de modelos, backends y Gateway en vivo respaldados por Docker, seleccionados mediante `release_profile`.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` específico.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`.                                                                                |
| Ruta de versión de Docker      | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** segmentos de Docker de la ruta de versión con el artefacto de paquete compartido.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` específico.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Aceptación del paquete       | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo subyacente:** `Package Acceptance`<br />**Pruebas:** fixtures sin conexión de paquetes de plugins, actualización de plugins, el E2E canónico de paquetes de Telegram con OpenAI simulado y comprobaciones de supervivencia tras una actualización publicada con el mismo archivo tar. Las comprobaciones de versión bloqueantes usan de forma predeterminada la última versión de referencia publicada; las comprobaciones prolongadas (`run_release_soak=true`) se amplían a las últimas 4 versiones estables de npm más 3 versiones históricas fijadas (`2026.4.23`, `2026.5.2`, `2026.4.15`) y se ejecutan con fixtures de actualización de incidencias notificadas.<br />**Reejecución:** `rerun_group=package`. |
| Cuadro de madurez       | **Trabajo:** `Render maturity scorecard release docs`<br />**Flujo de trabajo subyacente:** `maturity-scorecard.yml`<br />**Pruebas:** genera la documentación informativa del cuadro de madurez con la referencia objetivo. Solo se ejecuta cuando se pasa `run_maturity_scorecard=true`.<br />**Reejecución:** `rerun_group=qa` con `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Paridad de QA                | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo subyacente:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica del candidato y de referencia y, después, el informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Paridad del runtime de QA        | **Trabajo:** `Run QA Lab runtime parity lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** un canal de paridad agéntica de pares de runtimes `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), que incluye un nivel estándar y, con `run_release_soak=true`, un nivel prolongado. Informativo: los fallos individuales no bloquean el verificador de comprobaciones de la versión.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                    |
| Cobertura de herramientas del runtime de QA | **Trabajo:** `Enforce QA Lab runtime tool coverage`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** desviación dinámica de herramientas entre `openclaw` y `codex` en el nivel estándar de paridad de runtimes (`pnpm openclaw qa coverage --tools`), mediante la salida del canal de paridad del runtime de QA. Bloqueante: este trabajo no puede sustituirse por una excepción informativa.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix en vivo de QA           | **Trabajo:** `Run QA Live Matrix profile`<br />**Flujo de trabajo subyacente:** flujo de trabajo reutilizable `QA-Lab - All Lanes`<br />**Pruebas:** escenarios YAML cuya paridad se ha demostrado mediante el adaptador compartido de Matrix en vivo en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`; use `live_suite_filter=qa-live-matrix` para una reejecución específica de Matrix.                                                                                                                                                                                                                    |
| Telegram en vivo de QA         | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo subyacente:** lanzamiento de confianza `OpenClaw Release Telegram QA`<br />**Pruebas:** QA de Telegram en vivo con concesiones de credenciales de CI de Convex.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                 |
| Discord en vivo de QA          | **Trabajo:** `Run QA Lab live Discord lane`<br />**Flujo de trabajo subyacente:** trabajo informativo directo<br />**Pruebas:** QA de Discord en vivo con concesiones de credenciales de CI de Convex cuando `OPENCLAW_RELEASE_QA_DISCORD_LIVE_CI_ENABLED` está habilitado.<br />**Reejecución:** `rerun_group=qa-live` con `live_suite_filter=qa-live-discord`.                                                                                                                                                                                                                                                                            |
| WhatsApp en vivo de QA         | **Trabajo:** `Run QA Lab live WhatsApp lane`<br />**Flujo de trabajo subyacente:** trabajo informativo directo<br />**Pruebas:** QA de WhatsApp en vivo con concesiones de credenciales de CI de Convex cuando `OPENCLAW_RELEASE_QA_WHATSAPP_LIVE_CI_ENABLED` está habilitado.<br />**Reejecución:** `rerun_group=qa-live` con `live_suite_filter=qa-live-whatsapp`.                                                                                                                                                                                                                                                                        |
| Slack en vivo de QA            | **Trabajo:** `Run QA Lab live Slack lane`<br />**Flujo de trabajo subyacente:** trabajo informativo directo<br />**Pruebas:** QA de Slack en vivo con concesiones de credenciales de CI de Convex cuando `OPENCLAW_RELEASE_QA_SLACK_LIVE_CI_ENABLED` está habilitado.<br />**Reejecución:** `rerun_group=qa-live` con `live_suite_filter=qa-live-slack`.                                                                                                                                                                                                                                                                                    |
| Verificador de la versión         | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** trabajos obligatorios de comprobación de la versión para el grupo de reejecución seleccionado.<br />**Reejecución:** vuelva a ejecutar después de que se completen correctamente los trabajos secundarios específicos.                                                                                                                                                                                                                                                                                                                                                                                   |

## Segmentos de la ruta de versión de Docker

La etapa de la ruta de versión de Docker ejecuta estos segmentos cuando `live_suite_filter` está vacío:

| Fragmento                                                        | Cobertura                                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Carriles principales de pruebas de humo de la ruta de lanzamiento de Docker.                                                                                                        |
| `package-update-openai`                                         | Comportamiento de instalación/actualización del paquete OpenAI, instalación bajo demanda de Codex, seguimiento del progreso en vivo del plugin Codex y llamadas a herramientas de Chat Completions. |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización del paquete Anthropic.                                                                                               |
| `package-update-core`                                           | Comportamiento de paquetes y actualizaciones independiente del proveedor.                                                                                                |
| `plugins-runtime-plugins`                                       | Carriles del entorno de ejecución de plugins que ejercitan el comportamiento de los plugins.                                                                                          |
| `plugins-runtime-services`                                      | Carriles del entorno de ejecución de plugins en vivo y respaldados por servicios.                                                                                                |
| `plugins-runtime-install-a` a `plugins-runtime-install-h` | Lotes de instalación/ejecución de plugins divididos para la validación paralela de versiones.                                                                        |
| `openwebui`                                                     | Prueba de humo de compatibilidad con OpenWebUI aislada en un ejecutor dedicado con disco de gran capacidad cuando se solicita.                                                      |

Use `docker_lanes=<lane[,lane]>` de forma selectiva en el flujo de trabajo reutilizable en vivo/E2E cuando
solo haya fallado un carril de Docker. Los artefactos de la versión incluyen comandos de
reejecución por carril con entradas para reutilizar el artefacto del paquete y la imagen cuando estén disponibles.

## Perfiles de versión

`release_profile` controla principalmente la amplitud de las pruebas en vivo/de proveedores dentro de las comprobaciones de la versión.
No elimina la Pipeline de CI completa normal, la versión preliminar de plugins, la prueba de humo de instalación, la
aceptación del paquete ni QA Lab. Los perfiles estable y completo siempre ejecutan una cobertura exhaustiva de
E2E del repositorio/en vivo y de pruebas prolongadas de la ruta de lanzamiento de Docker. El perfil beta puede habilitarla con
`run_release_soak=true`. La aceptación del paquete proporciona la prueba E2E canónica del paquete de
Telegram para cada candidato completo, por lo que el flujo general no duplica ese
sondeador en vivo.

| Perfil  | Uso previsto                      | Cobertura en vivo/de proveedores incluida                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Prueba de humo crítica para la versión más rápida.   | Ruta principal en vivo de OpenAI, modelos en vivo de Docker para OpenAI, núcleo nativo del Gateway, perfil nativo del Gateway de OpenAI, plugin nativo de OpenAI y Gateway en vivo de Docker para OpenAI.                                            |
| `stable` | Perfil predeterminado de aprobación de versiones. | `beta` más prueba de humo de Anthropic, Google, MiniMax, backend, arnés nativo de pruebas en vivo, backend de CLI en vivo de Docker, enlace ACP de Docker, arnés Codex de Docker, anuncio de subagentes de Docker y un fragmento de prueba de humo de OpenCode Go. |
| `full`   | Revisión consultiva amplia.             | `stable` más proveedores consultivos, fragmentos de plugins en vivo y fragmentos multimedia en vivo.                                                                                                                               |

## Adiciones exclusivas del perfil completo

Estas suites se omiten con `stable` y se incluyen con `full`:

| Área                             | Cobertura exclusiva del perfil completo                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos en vivo de Docker               | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                          |
| Gateway en vivo de Docker              | Proveedores consultivos divididos en fragmentos DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                              |
| Perfiles de proveedores del Gateway nativo | Fragmentos completos Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, fragmentos completos de modelos OpenCode Go, OpenRouter, xAI y Z.ai. |
| Fragmentos nativos de plugins en vivo        | Plugins A-K, L-N, otros O-Z, Moonshot y xAI.                                                                             |
| Fragmentos multimedia nativos en vivo         | Audio, música de Google, música de MiniMax y grupos de vídeo A-D.                                                                   |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` utiliza en su lugar los fragmentos más amplios
de modelos Anthropic y OpenCode Go. Las reejecuciones selectivas aún pueden utilizar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Reejecuciones selectivas

Use `rerun_group` para evitar repetir entornos de versión no relacionados:

| Identificador              | Alcance                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Todas las etapas de la validación completa de la versión.                                                             |
| `ci`                | Solo el flujo secundario manual de CI completa.                                                                      |
| `plugin-prerelease` | Solo el flujo secundario de versión preliminar de plugins.                                                                   |
| `release-checks`    | Todas las etapas de comprobaciones de versión de OpenClaw.                                                             |
| `install-smoke`     | Desde la prueba de humo de instalación hasta las comprobaciones de la versión.                                                           |
| `cross-os`          | Comprobaciones de versión entre sistemas operativos.                                                                        |
| `live-e2e`          | E2E del repositorio/en vivo y validación de la ruta de lanzamiento de Docker.                                               |
| `package`           | Aceptación del paquete.                                                                             |
| `qa`                | Paridad de QA más carriles de QA en vivo.                                                                   |
| `qa-parity`         | Solo los carriles y el informe de paridad de QA.                                                                |
| `qa-live`           | Matrix/Telegram de QA en vivo más carriles condicionados de Discord, WhatsApp y Slack cuando estén habilitados.             |
| `npm-telegram`      | E2E de Telegram con el paquete publicado; requiere `release_package_spec` o `npm_telegram_package_spec`. |
| `performance`       | Solo evidencia de rendimiento del producto.                                                              |

Use `live_suite_filter` con `rerun_group=live-e2e` cuando falle una suite en vivo.
Los identificadores de filtro válidos se definen en el flujo de trabajo reutilizable en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

Para una reejecución selectiva de un transporte de QA, establezca `rerun_group=qa-live` y utilice el
selector canónico `qa-live-matrix`, `qa-live-telegram`, `qa-live-discord`,
`qa-live-whatsapp` o `qa-live-slack`.

El identificador `live-gateway-advisory-docker` es un identificador de reejecución agregado para sus
tres fragmentos de proveedores, por lo que sigue distribuyéndose entre todos los trabajos consultivos del Gateway de Docker.

Use `cross_os_suite_filter` con `rerun_group=cross-os` cuando falle un carril
entre sistemas operativos. El filtro acepta un identificador de SO, un identificador de suite o un par SO/suite, por
ejemplo `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes
entre sistemas operativos incluyen tiempos por fase para los carriles de actualización empaquetada, y los comandos
de larga duración imprimen líneas de Heartbeat para que una actualización bloqueada sea visible antes de que
se agote el tiempo de espera del trabajo.

Los fallos en las comprobaciones de versión de QA bloquean la validación normal de la versión solo para los carriles
seleccionados de cobertura de Matrix, Telegram y herramientas del entorno de ejecución de QA. La paridad de QA, la paridad
del entorno de ejecución y los carriles en vivo condicionados de Discord, WhatsApp y Slack son consultivos y
publican artefactos de estado sin bloquear el verificador de la versión. Las ejecuciones alfa de Tideclaw
aún pueden tratar como consultivos los carriles de comprobación de versión que no afectan a la seguridad del paquete. Con
`release_profile=beta`, las suites de proveedores en vivo `Run repo/live E2E validation`
son consultivas: las implementaciones de modelos de terceros cambian durante una versión, por lo que
beta presenta sus fallos como advertencias, mientras que los perfiles estable y completo mantienen
su carácter bloqueante. Cuando
`live_suite_filter` solicita explícitamente un carril de QA en vivo condicionado, como Discord,
WhatsApp o Slack, debe estar habilitada la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
correspondiente; de lo contrario, la captura de entradas falla en vez de omitir silenciosamente el carril.
Vuelva a ejecutar `rerun_group=qa`, `qa-parity` o `qa-live` cuando
necesite evidencia de QA actualizada.

## Evidencia que se debe conservar

Conserve el resumen `Full Release Validation` como índice de la versión. Enlaza
los identificadores de las ejecuciones secundarias e incluye tablas de los trabajos más lentos. En caso de fallos, inspeccione primero el
flujo de trabajo secundario y después vuelva a ejecutar el identificador coincidente más específico de los anteriores.

Registre tanto el SHA del código como el SHA de la versión, la política de reutilización y el conjunto de rutas modificadas, la
ejecución principal correcta del SHA del código y la ejecución principal ligera del SHA de la versión.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de la ruta de lanzamiento de Docker en `.artifacts/docker-tests/`
- `package-under-test` de aceptación del paquete y artefactos de aceptación de Docker
- Artefactos de comprobación de versiones entre sistemas operativos para cada SO y suite
- Artefactos de paridad de QA, paridad del entorno de ejecución y de Matrix, Telegram, Discord, WhatsApp
  o Slack seleccionados

## Archivos de flujo de trabajo

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
