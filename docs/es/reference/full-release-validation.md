---
read_when:
    - Ejecución o repetición de la validación completa de la versión
    - Comparación de los perfiles de validación de versiones estables y completas
    - Depuración de errores en las etapas de validación de versiones
summary: Etapas de validación completa de la versión, flujos de trabajo secundarios, perfiles de versión, identificadores de reejecución y evidencias
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-07-14T14:06:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f4dad526111a514392a6a0108e88ed276461155ac6768444458eb44ad8c0ee35
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el flujo general de validación del producto para la versión. La mayor parte del trabajo
se realiza en flujos secundarios, de modo que una máquina con errores pueda volver a ejecutarse sin reiniciar
toda la versión.

Inmovilice el commit anterior al registro de cambios que contiene el producto completo como **Code SHA** y, a continuación, ejecute:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` también acepta `anthropic` o `minimax` para la incorporación entre distintos sistemas operativos y el
turno integral del agente. El asistente infiere el perfil `beta` a partir de versiones de paquetes
alfa/beta y `stable` en caso contrario. Pase entradas alternativas del flujo de trabajo con
`-f key=value`; use `-f release_profile=full` únicamente para el análisis general de avisos.

El asistente crea una referencia temporal `release-ci/*` fijada a un único SHA de flujo de trabajo
`origin/main` de confianza, pasa el SHA de destino únicamente como `ref` candidato
y elimina la referencia temporal después de la validación. Cada flujo secundario ejecutado debe
informar del mismo SHA de flujo de trabajo. Pase
`-f reuse_evidence=false` para forzar una ejecución nueva o
`--workflow-sha <trusted-main-sha>` para seleccionar un commit anterior del flujo de trabajo que todavía
sea accesible desde el `origin/main` actual. El flujo de trabajo nunca crea ni actualiza
por sí mismo las referencias del repositorio.

Cuando el Code SHA esté en verde, genere y confirme únicamente `CHANGELOG.md`. Este nuevo
commit es el **Release SHA**. Ejecute el mismo asistente para el Release SHA. La evidencia
del producto solo se reutiliza cuando GitHub demuestra que el Release SHA desciende del
Code SHA y que el conjunto completo de rutas modificadas es exactamente `CHANGELOG.md`; la comprobación
preliminar de npm y la aceptación del paquete o de la instalación siguen ejecutándose en el Release SHA.

`release_profile=stable` y `release_profile=full` siempre ejecutan la prueba prolongada exhaustiva
en vivo/Docker. Pase `run_release_soak=true` para incluir las mismas vías de prueba prolongada
con el perfil `beta`. La publicación estable rechaza un manifiesto de validación
sin esta prueba prolongada y sin evidencia bloqueante de rendimiento del producto.

Package Acceptance normalmente compila el tarball candidato desde el
`ref` resuelto, incluidas las ejecuciones con SHA completo iniciadas con `pnpm ci:full-release`. Después de una
publicación beta, pase `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar
el paquete de npm publicado en las comprobaciones de versión, Package Acceptance, las pruebas entre sistemas operativos,
Docker en la ruta de publicación y Telegram con el paquete. Use `package_acceptance_package_spec`
únicamente cuando Package Acceptance deba comprobar intencionadamente un paquete diferente.
La vía de paquete en vivo del plugin de Codex sigue el mismo estado: los valores
`release_package_spec` publicados derivan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
las ejecuciones con SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada; y los operadores
pueden establecer `codex_plugin_spec` directamente para fuentes del plugin
`npm:`, `npm-pack:` o `git:`. La vía concede la aprobación explícita de instalación de Codex CLI que exige
ese plugin y, a continuación, ejecuta la comprobación preliminar de Codex CLI y turnos del agente de OpenAI en la misma sesión.

## Etapas de nivel superior

Para `rerun_group=all`, primero se ejecuta un trabajo
`Check for reusable validation evidence`. Busca la validación completa correcta anterior más reciente con el mismo perfil de versión,
la misma configuración efectiva de prueba prolongada y las mismas entradas de validación. Las repeticiones del destino exacto usan
`exact-target-full-validation-v1`. Un descendiente cuya diferencia completa sea exactamente
`CHANGELOG.md` usa `changelog-only-release-v1`; se omiten todas las vías del producto
y el verificador vuelve a comprobar de forma independiente la comparación de commits de GitHub, el
artefacto principal inmutable, las ejecuciones secundarias y los registros de inicio. Cualquier otro cambio de destino exige
una validación nueva del Code SHA. Pase `reuse_evidence=false` para forzar una ejecución completa
nueva. La reutilización de evidencia solo se ejecuta desde `main` o desde una referencia
`release-ci/*` canónica fijada mediante SHA cuyo commit del flujo de trabajo permanezca en el linaje
`main` de confianza; las demás referencias del flujo de trabajo ejecutan de nuevo las vías seleccionadas.

También para `rerun_group=all`, un trabajo `Verify Docker runtime image assets` compila
el destino de Docker `runtime-assets` con
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Se ejecuta en paralelo con las
demás etapas y el verificador general exige su cumplimiento; las vías ya no esperan a
que termine antes de iniciarse. Un `rerun_group` más limitado omite esta comprobación preliminar.

| Etapa                   | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del destino       | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de publicación, la etiqueta o el SHA completo del commit y registra las entradas seleccionadas.<br />**Repetición:** vuelva a ejecutar el flujo general si falla.                                                                                                                                                                                                                                                                                                            |
| Comprobación preliminar de recursos de Docker | **Trabajo:** `Verify Docker runtime image assets`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** el destino de compilación de Docker `runtime-assets` sigue funcionando correctamente antes de que se inicie cualquier otra etapa. Solo se ejecuta para `rerun_group=all`.<br />**Repetición:** vuelva a ejecutar el flujo general con `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest y CI normal    | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** el grafo de CI completo manual con la referencia de destino, incluidas las vías de Node en Linux, los fragmentos de plugins incluidos, los fragmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS, la i18n de Control UI y Android mediante el flujo general.<br />**Repetición:** `rerun_group=ci`.                                                                                          |
| Versión preliminar de plugins       | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de plugins exclusivas de la versión, cobertura de plugins mediante agentes, fragmentos completos de lotes de plugins, vías de Docker para la versión preliminar de plugins y un artefacto `plugin-inspector-advisory` no bloqueante para el triaje de compatibilidad.<br />**Repetición:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Comprobaciones de la versión          | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** comprobación rápida de instalación, comprobaciones de paquetes entre sistemas operativos, Package Acceptance, paridad con QA Lab, Matrix en vivo y Telegram en vivo. Los perfiles estable y completo también ejecutan conjuntos exhaustivos en vivo/E2E y fragmentos de Docker en la ruta de publicación; la beta puede incluirlos mediante `run_release_soak=true`.<br />**Repetición:** `rerun_group=release-checks` o un identificador más limitado de comprobaciones de la versión.                                                                |
| Telegram con el paquete        | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** una prueba E2E específica de Telegram con el paquete publicado cuando se establece `release_package_spec` o `npm_telegram_package_spec`. La validación completa del candidato usa en su lugar la prueba E2E canónica de Telegram de Package Acceptance.<br />**Repetición:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                                                                                                              |
| Rendimiento del producto     | **Trabajo:** `Run product performance evidence`<br />**Flujo de trabajo secundario:** `OpenClaw Performance`<br />**Demuestra:** ejecución de rendimiento del perfil de versión (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) con el SHA de destino. La salida de Kova permanece en los artefactos del flujo de trabajo y el flujo secundario debe demostrar que se omitió su publicador de informes. Es obligatoria (bloqueante) únicamente para `rerun_group=all` o `rerun_group=performance`; no es obligatoria para grupos de repetición más limitados.<br />**Repetición:** `rerun_group=performance`. |
| Verificador general       | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y añade tablas de los trabajos más lentos de los flujos de trabajo secundarios.<br />**Repetición:** vuelva a ejecutar únicamente este trabajo después de repetir un flujo secundario con errores hasta que esté en verde.                                                                                                                                                                                                                                                                 |

El flujo general siempre inicia el rendimiento del producto en modo de solo artefactos.
`OpenClaw Performance` permite publicar informes únicamente para ejecuciones programadas o para un
inicio manual que establezca explícitamente `publish_reports=true`. La protección del modo
de solo artefactos debe completarse correctamente, lo que demuestra que el trabajo del publicador permaneció omitido.
Las evidencias nuevas y reutilizadas registran
`controls.performanceReportPublication=artifact-only`; el verificador y el selector de reutilización
rechazan las evidencias sin la prueba normalizada correspondiente del flujo secundario de rendimiento.

El verificador carga el manifiesto canónico como
`full-release-validation-<run-id>-<run-attempt>`. Las herramientas de evidencia validan
su ID de artefacto, resumen, ejecución productora e intento antes de descargar ese ID de
artefacto exacto. Limitan el ZIP descargado, verifican sus bytes mediante el resumen
`sha256:` de REST y transmiten la única entrada acotada permitida del manifiesto sin
extraer el archivo. Se conserva temporalmente un alias de nombre estable para consumidores
de publicación anteriores. El verificador siempre prefiere el artefacto cuyo nombre incluye el intento;
como transición, acepta el nombre estable únicamente para un productor del manifiesto v2
en el intento 1. Rechaza ese nombre heredado para intentos posteriores y para el manifiesto v3.

Para `ref=main` con `rerun_group=all`, para referencias `release/*` y para referencias alfa de Tideclaw,
una ejecución más reciente del flujo general sustituye a una anterior con la misma referencia y
el mismo grupo de repetición. Cuando se cancela el flujo principal, su monitor cancela todos los flujos de trabajo
secundarios que ya haya iniciado. Las ejecuciones de validación de etiquetas y SHA fijados no
se cancelan entre sí.

## Etapas de las comprobaciones de la versión

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el destino
una vez y prepara un artefacto `release-package-under-test` compartido cuando lo necesitan las etapas
orientadas a paquetes o Docker.

| Etapa                    | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de lanzamiento           | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de repetición y filtro específico del conjunto de pruebas en vivo.<br />**Repetición:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artefacto de paquete         | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y carga `release-package-under-test` para las comprobaciones posteriores relacionadas con paquetes.<br />**Repetición:** el grupo afectado de paquete, multiplataforma o en vivo/E2E.                                                                                                                                                                                                                                                                                             |
| Prueba rápida de instalación            | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo subyacente:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de la imagen de prueba rápida del Dockerfile raíz, instalación del paquete QR, pruebas rápidas de Docker de la raíz y del Gateway, pruebas de Docker del instalador y prueba rápida del proveedor de imágenes con instalación global de Bun.<br />**Repetición:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Multiplataforma                 | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo subyacente:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** carriles de instalación nueva y actualización en Linux, Windows y macOS para el proveedor y el modo seleccionados, utilizando el tarball candidato y un paquete de referencia.<br />**Repetición:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E del repositorio y en vivo        | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E del repositorio, caché en vivo, transmisión por websocket de OpenAI, fragmentos del proveedor nativo en vivo y de plugins, y bancos de pruebas de modelo/backend/Gateway en vivo respaldados por Docker seleccionados mediante `release_profile`.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` específico.<br />**Repetición:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`.                                                                                |
| Ruta de lanzamiento de Docker      | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** bloques de Docker de la ruta de lanzamiento con el artefacto de paquete compartido.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` específico.<br />**Repetición:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Aceptación de paquetes       | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo subyacente:** `Package Acceptance`<br />**Pruebas:** fixtures sin conexión de paquetes de plugins, actualización de plugins, el E2E canónico de paquetes de Telegram con OpenAI simulado y comprobaciones de supervivencia tras actualizar desde versiones publicadas con el mismo tarball. Las comprobaciones de lanzamiento bloqueantes utilizan de forma predeterminada la última versión de referencia publicada; las comprobaciones prolongadas (`run_release_soak=true`) se amplían a las últimas 4 versiones estables de npm más 3 versiones históricas fijadas (`2026.4.23`, `2026.5.2`, `2026.4.15`) y se ejecutan con fixtures de actualización de incidencias notificadas.<br />**Repetición:** `rerun_group=package`. |
| Cuadro de indicadores de madurez       | **Trabajo:** `Render maturity scorecard release docs`<br />**Flujo de trabajo subyacente:** `maturity-scorecard.yml`<br />**Pruebas:** genera la documentación del cuadro de indicadores orientativo de madurez con la referencia de destino. Solo se ejecuta cuando se proporciona `run_maturity_scorecard=true`.<br />**Repetición:** `rerun_group=qa` con `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Paridad de QA                | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo subyacente:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica del candidato y de la referencia, seguidos del informe de paridad.<br />**Repetición:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Paridad del entorno de ejecución de QA        | **Trabajo:** `Run QA Lab runtime parity lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** un carril de paridad agéntica de pares de entornos de ejecución `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), que incluye un nivel estándar y, con `run_release_soak=true`, un nivel prolongado. Orientativo: los fallos individuales no bloquean el verificador de comprobaciones de lanzamiento.<br />**Repetición:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                    |
| Cobertura de herramientas del entorno de ejecución de QA | **Trabajo:** `Enforce QA Lab runtime tool coverage`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** desviación dinámica de herramientas entre `openclaw` y `codex` en el nivel estándar de paridad de entornos de ejecución (`pnpm openclaw qa coverage --tools`), utilizando la salida del carril de paridad del entorno de ejecución de QA. Bloqueante: este trabajo no admite anulación por su carácter orientativo.<br />**Repetición:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix en vivo de QA           | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** perfil rápido de QA de Matrix en vivo en el entorno `qa-live-shared`.<br />**Repetición:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| Telegram en vivo de QA         | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** QA de Telegram en vivo con asignaciones temporales de credenciales de CI de Convex.<br />**Repetición:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                      |
| Verificador de lanzamiento         | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** trabajos obligatorios de comprobación de lanzamiento para el grupo de repetición seleccionado.<br />**Repetición:** repetir después de que se superen los trabajos secundarios específicos.                                                                                                                                                                                                                                                                                                                                                                                   |

## Bloques de la ruta de lanzamiento de Docker

La etapa de la ruta de lanzamiento de Docker ejecuta estos bloques cuando
`live_suite_filter` está vacío:

| Bloque                                                           | Cobertura                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Carriles principales de pruebas rápidas de la ruta de lanzamiento de Docker.                                                                                      |
| `package-update-openai`                                         | Comportamiento de instalación/actualización del paquete OpenAI, instalación bajo demanda de Codex, interacciones en vivo del plugin de Codex y llamadas a herramientas de Chat Completions. |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización del paquete Anthropic.                                                                             |
| `package-update-core`                                           | Comportamiento de paquetes y actualizaciones independiente del proveedor.                                                                              |
| `plugins-runtime-plugins`                                       | Carriles del entorno de ejecución de plugins que ejercitan el comportamiento de los plugins.                                                                        |
| `plugins-runtime-services`                                      | Carriles del entorno de ejecución de plugins respaldados por servicios y en vivo.                                                                              |
| `plugins-runtime-install-a` a `plugins-runtime-install-h` | Lotes de instalación/ejecución de plugins divididos para la validación paralela del lanzamiento.                                                      |
| `openwebui`                                                     | Prueba rápida de compatibilidad con OpenWebUI aislada en un ejecutor dedicado con disco de gran capacidad cuando se solicita.                                    |

Utilice `docker_lanes=<lane[,lane]>` de forma específica en el flujo de trabajo reutilizable en vivo/E2E cuando
solo haya fallado un carril de Docker. Los artefactos de lanzamiento incluyen comandos
de repetición por carril con entradas para reutilizar el artefacto de paquete y la imagen cuando estén disponibles.

## Perfiles de lanzamiento

`release_profile` controla principalmente la amplitud de las pruebas en vivo y de proveedores dentro de las comprobaciones de lanzamiento.
No elimina la CI completa normal, la versión preliminar de plugins, la prueba rápida de instalación, la aceptación de
paquetes ni QA Lab. Los perfiles estable y completo siempre ejecutan una cobertura exhaustiva
E2E del repositorio/en vivo y de pruebas prolongadas de la ruta de lanzamiento de Docker. El perfil beta puede incluirla mediante
`run_release_soak=true`. La aceptación de paquetes proporciona el E2E canónico de paquetes
de Telegram para cada candidato completo, por lo que el flujo general no duplica ese
sondeador en vivo.

| Perfil  | Uso previsto                      | Cobertura en vivo/de proveedores incluida                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Prueba de humo crítica para la versión y de máxima rapidez.   | Ruta en vivo de OpenAI/núcleo, modelos en vivo de Docker para OpenAI, núcleo del Gateway nativo, perfil nativo del Gateway de OpenAI, Plugin nativo de OpenAI y Gateway en vivo de Docker para OpenAI.                                            |
| `stable` | Perfil predeterminado de aprobación de versiones. | `beta` más prueba de humo de Anthropic, Google, MiniMax, backend, arnés nativo de pruebas en vivo, backend de CLI en vivo de Docker, enlace ACP de Docker, arnés de Codex de Docker, anuncio de subagentes de Docker y un fragmento de prueba de humo de OpenCode Go. |
| `full`   | Barrido consultivo amplio.             | `stable` más proveedores consultivos, fragmentos en vivo de plugins y fragmentos multimedia en vivo.                                                                                                                               |

## Incorporaciones exclusivas del perfil completo

Estas suites se omiten con `stable` y se incluyen con `full`:

| Área                             | Cobertura exclusiva del perfil completo                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos en vivo de Docker               | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                          |
| Gateway en vivo de Docker              | Proveedores consultivos divididos en los fragmentos DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                              |
| Perfiles de proveedores del Gateway nativo | Fragmentos completos de Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, fragmentos completos de modelos de OpenCode Go, OpenRouter, xAI y Z.ai. |
| Fragmentos en vivo de plugins nativos        | Plugins A-K, L-N, otros O-Z, Moonshot y xAI.                                                                             |
| Fragmentos multimedia en vivo nativos         | Audio, música de Google, música de MiniMax y grupos de vídeo A-D.                                                                   |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; en su lugar, `full` usa los fragmentos más amplios
de modelos de Anthropic y OpenCode Go. Las repeticiones específicas aún pueden usar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Repeticiones específicas

Use `rerun_group` para evitar repetir entornos de versión no relacionados:

| Identificador              | Alcance                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Todas las etapas de validación completa de la versión.                                                             |
| `ci`                | Solo el flujo secundario de CI completo manual.                                                                      |
| `plugin-prerelease` | Solo el flujo secundario de prelanzamiento de plugins.                                                                   |
| `release-checks`    | Todas las etapas de comprobaciones de versión de OpenClaw.                                                             |
| `install-smoke`     | Prueba de humo de instalación hasta las comprobaciones de versión.                                                           |
| `cross-os`          | Comprobaciones de versión entre sistemas operativos.                                                                        |
| `live-e2e`          | E2E del repositorio/en vivo y validación de la ruta de versión de Docker.                                               |
| `package`           | Aceptación de paquetes.                                                                             |
| `qa`                | Paridad de QA más vías de QA en vivo.                                                                   |
| `qa-parity`         | Solo vías e informe de paridad de QA.                                                                |
| `qa-live`           | Matrix/Telegram de QA en vivo más vías restringidas de Discord, WhatsApp y Slack cuando estén habilitadas.             |
| `npm-telegram`      | E2E de Telegram con el paquete publicado; requiere `release_package_spec` o `npm_telegram_package_spec`. |
| `performance`       | Solo evidencia de rendimiento del producto.                                                              |

Use `live_suite_filter` con `rerun_group=live-e2e` cuando falle una suite en vivo.
Los identificadores de filtro válidos se definen en el flujo de trabajo reutilizable en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador de repetición agregado para sus
tres fragmentos de proveedores, por lo que sigue distribuyéndose a todos los trabajos consultivos del Gateway de Docker.

Use `cross_os_suite_filter` con `rerun_group=cross-os` cuando falle una vía entre sistemas operativos.
El filtro acepta un identificador de SO, un identificador de suite o un par SO/suite; por
ejemplo, `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes
entre sistemas operativos incluyen tiempos por fase para las vías de actualización con paquetes, y los comandos
de larga duración imprimen líneas de Heartbeat para que una actualización bloqueada sea visible antes de que se
agote el tiempo de espera del trabajo.

Los fallos en las comprobaciones de versión de QA bloquean la validación normal de la versión. La comprobación
de cobertura de herramientas del entorno de ejecución de QA (desviación dinámica de herramientas entre `openclaw` y `codex` en el
nivel estándar) también bloquea el verificador de comprobaciones de versión, aunque la
vía subyacente de paridad del entorno de ejecución de QA sea consultiva. Las ejecuciones alfa de Tideclaw aún pueden
tratar como consultivas las vías de comprobaciones de versión no relacionadas con la seguridad de los paquetes. Con
`release_profile=beta`, las suites de proveedores en vivo `Run repo/live E2E validation`
son consultivas: las implementaciones de modelos de terceros cambian durante una versión, por lo que
el perfil beta presenta sus fallos como advertencias, mientras que los perfiles estable y completo los mantienen
como bloqueantes. Cuando
`live_suite_filter` solicita explícitamente una vía restringida de QA en vivo, como Discord,
WhatsApp o Slack, debe estar habilitada la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
correspondiente; de lo contrario, la captura de entrada falla en lugar de omitir silenciosamente la vía.
Vuelva a ejecutar `rerun_group=qa`, `qa-parity` o `qa-live` cuando
necesite evidencia de QA reciente.

## Evidencia que se debe conservar

Conserve el resumen `Full Release Validation` como índice de la versión. Este enlaza
los identificadores de las ejecuciones secundarias e incluye tablas de los trabajos más lentos. En caso de fallos, inspeccione primero el
flujo de trabajo secundario y, después, vuelva a ejecutar el identificador coincidente más específico de los anteriores.

Registre tanto el SHA del código como el SHA de la versión, la política de reutilización y el conjunto de rutas modificadas, la
ejecución principal correcta del SHA del código y la ejecución principal ligera del SHA de la versión.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de la ruta de versión de Docker en `.artifacts/docker-tests/`
- `package-under-test` de aceptación de paquetes y artefactos de aceptación de Docker
- Artefactos de comprobación de versión entre sistemas operativos para cada SO y suite
- Artefactos de paridad de QA, paridad del entorno de ejecución, Matrix y Telegram

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
