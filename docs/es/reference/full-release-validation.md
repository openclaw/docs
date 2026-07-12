---
read_when:
    - Ejecución o repetición de la validación completa de la versión
    - Comparación de los perfiles de validación de las versiones estable y completa
    - Depuración de fallos en las etapas de validación de versiones
summary: Etapas de validación completa de la versión, flujos de trabajo secundarios, perfiles de versión, identificadores de reejecución y evidencias
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-07-11T23:29:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el flujo general de la versión: el único punto de entrada manual
para las pruebas previas al lanzamiento. La mayor parte del trabajo se realiza en flujos de trabajo secundarios para que una máquina con errores pueda
volver a ejecutarse sin reiniciar todo el lanzamiento.

Ejecútelo desde una referencia de flujo de trabajo de confianza, normalmente `main`, y pase la rama,
la etiqueta o el SHA completo del commit de la versión como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` también acepta `anthropic` o `minimax` para la incorporación entre sistemas operativos y el
turno integral del agente. Los trabajos secundarios reutilizables resuelven el entorno del flujo de trabajo invocado
desde `job.workflow_repository` y `job.workflow_sha`, mientras que la entrada `ref`
selecciona el candidato que se somete a prueba. Esto mantiene disponible la lógica de validación
de confianza actual al validar una rama o etiqueta de una versión anterior.

Cada flujo secundario iniciado debe informar el mismo SHA del flujo de trabajo que la ejecución principal de
`Full Release Validation`. Si `main` cambia entre los inicios del flujo principal y los secundarios,
el flujo general falla de forma segura incluso si el propio flujo secundario finaliza correctamente. Para
obtener una prueba inmutable de un commit exacto, use
`pnpm ci:full-release --sha <target-sha>`. La herramienta crea una referencia
`release-ci/*` temporal fijada al `origin/main` de confianza actual, pasa el SHA
de destino únicamente como la referencia candidata `ref`, reutiliza las pruebas estrictas del destino exacto cuando
están disponibles y elimina la referencia después de la validación. Pase
`-f reuse_evidence=false` para forzar una ejecución nueva o
`--workflow-sha <trusted-main-sha>` para seleccionar un commit anterior del flujo de trabajo que aún sea
alcanzable desde el `origin/main` actual. El flujo de trabajo nunca crea ni actualiza
referencias del repositorio por sí mismo.

`release_profile=stable` y `release_profile=full` siempre ejecutan la prueba prolongada
exhaustiva en vivo y con Docker. Pase `run_release_soak=true` para incluir las mismas rutas de prueba prolongada
con el perfil `beta`. La publicación estable rechaza un manifiesto de validación
que no incluya esta prueba prolongada y pruebas bloqueantes del rendimiento del producto.

Package Acceptance normalmente compila el tarball candidato desde la referencia
`ref` resuelta, incluidas las ejecuciones con SHA completo iniciadas mediante `pnpm ci:full-release`. Después de
publicar una versión beta, pase `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar
el paquete npm publicado en las comprobaciones de la versión, Package Acceptance, las pruebas entre sistemas operativos,
la ruta de lanzamiento de Docker y Telegram con el paquete. Use `package_acceptance_package_spec`
solo cuando Package Acceptance deba probar intencionalmente un paquete diferente.
La ruta del paquete en vivo del Plugin Codex sigue el mismo estado: los valores publicados de
`release_package_spec` derivan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
las ejecuciones con SHA o artefactos empaquetan `extensions/codex` desde la referencia seleccionada; y los operadores
pueden establecer directamente `codex_plugin_spec` para fuentes de Plugin
`npm:`, `npm-pack:` o `git:`. La ruta concede la aprobación explícita de instalación de Codex CLI que requiere
ese Plugin y, a continuación, ejecuta la comprobación previa de Codex CLI y turnos del agente de OpenAI en la misma sesión.

## Etapas de nivel superior

Para `rerun_group=all`, primero se ejecuta un trabajo `Check for reusable validation evidence`:
busca la validación completa correcta anterior más reciente para exactamente el mismo
SHA de destino, perfil de versión, configuración efectiva de la prueba prolongada y entradas de validación.
Cuando existen tales pruebas, se omiten todas las rutas y el verificador general
vuelve a comprobar el artefacto inmutable del flujo principal, las ejecuciones secundarias y los registros de inicio. Esto es
solo una recuperación de la repetición de la ejecución para el mismo candidato; no autoriza la reutilización entre distintos SHA. Para
un candidato modificado, vuelva a ejecutar cada comprobación de paquete, artefacto, instalación, Docker o proveedor
afectada por esa diferencia. Pase `reuse_evidence=false` para forzar una ejecución completa
nueva. La reutilización de pruebas solo se ejecuta desde `main` o desde una referencia canónica
`release-ci/*` fijada por SHA cuyo commit de flujo de trabajo permanezca en el linaje de confianza de `main`;
otras referencias de flujo de trabajo ejecutan de nuevo las rutas seleccionadas.

También para `rerun_group=all`, un trabajo `Verify Docker runtime image assets` compila
el destino de Docker `runtime-assets` con
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Se ejecuta en paralelo con las
demás etapas y el verificador general lo exige; las rutas ya no esperan a que
termine antes de iniciarse. Un `rerun_group` más específico omite esta comprobación previa.

| Etapa                   | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del destino       | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama, la etiqueta o el SHA completo del commit de la versión y registra las entradas seleccionadas.<br />**Repetición:** vuelva a ejecutar el flujo general si falla.                                                                                                                                                                                                                                                                                                            |
| Comprobación previa de recursos de Docker | **Trabajo:** `Verify Docker runtime image assets`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** el destino de compilación de Docker `runtime-assets` continúa ejecutándose correctamente antes de iniciar cualquier otra etapa. Solo se ejecuta para `rerun_group=all`.<br />**Repetición:** vuelva a ejecutar el flujo general con `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest y CI normal    | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** el grafo manual completo de CI frente a la referencia de destino, incluidas las rutas de Node en Linux, los fragmentos de Plugins incluidos, los fragmentos de contratos de Plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS, la internacionalización de Control UI y Android mediante el flujo general.<br />**Repetición:** `rerun_group=ci`.                                                                                          |
| Versión preliminar de Plugins       | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de Plugins exclusivas de la versión, cobertura de Plugins con agentes, fragmentos del lote completo de Plugins, rutas de Docker para la versión preliminar de Plugins y un artefacto no bloqueante `plugin-inspector-advisory` para la clasificación de compatibilidad.<br />**Repetición:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Comprobaciones de la versión          | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** comprobación rápida de instalación, comprobaciones de paquetes entre sistemas operativos, Package Acceptance, paridad de QA Lab, Matrix en vivo y Telegram en vivo. Los perfiles estable y completo también ejecutan conjuntos exhaustivos en vivo e integrales y segmentos de la ruta de lanzamiento de Docker; la versión beta puede habilitarlos con `run_release_soak=true`.<br />**Repetición:** `rerun_group=release-checks` o un identificador más específico de las comprobaciones de la versión.                                                                |
| Telegram con el paquete        | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** una prueba integral específica de Telegram con el paquete publicado cuando se establece `release_package_spec` o `npm_telegram_package_spec`. La validación completa del candidato usa en su lugar la prueba integral canónica de Telegram de Package Acceptance.<br />**Repetición:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                                                                                                              |
| Rendimiento del producto     | **Trabajo:** `Run product performance evidence`<br />**Flujo de trabajo secundario:** `OpenClaw Performance`<br />**Demuestra:** ejecución de rendimiento del perfil de versión (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) frente al SHA de destino. La salida de Kova permanece en los artefactos del flujo de trabajo y el flujo secundario debe demostrar que se omitió su publicador de informes. Es obligatoria y bloqueante solo para `rerun_group=all` o `rerun_group=performance`; no es obligatoria para grupos de repetición más específicos.<br />**Repetición:** `rerun_group=performance`. |
| Verificador general       | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y agrega tablas de los trabajos más lentos de los flujos de trabajo secundarios.<br />**Repetición:** vuelva a ejecutar únicamente este trabajo después de repetir un flujo secundario fallido hasta que finalice correctamente.                                                                                                                                                                                                                                                                 |

El flujo general siempre inicia el rendimiento del producto en modo de solo artefactos.
`OpenClaw Performance` permite publicar informes únicamente en ejecuciones programadas o en un
inicio manual que establezca explícitamente `publish_reports=true`. La protección del modo de solo artefactos
debe completarse correctamente para demostrar que el trabajo publicador permaneció omitido.
Las pruebas nuevas y reutilizadas registran
`controls.performanceReportPublication=artifact-only`; el verificador y el selector de reutilización
rechazan las pruebas que no incluyan la prueba normalizada correspondiente del flujo secundario de rendimiento.

El verificador carga el manifiesto canónico como
`full-release-validation-<run-id>-<run-attempt>`. Las herramientas de pruebas validan
el identificador del artefacto, el resumen, la ejecución productora y el intento antes de descargar ese
identificador exacto del artefacto. Limitan el ZIP descargado, verifican sus bytes con el resumen
`sha256:` de REST y transmiten la única entrada permitida y de tamaño limitado del manifiesto sin
extraer el archivo. Se mantiene temporalmente un alias de nombre estable para consumidores de
publicación antiguos. El verificador siempre prefiere el artefacto cuyo nombre incluye el intento;
como transición, acepta el nombre estable únicamente para un productor del manifiesto v2
en el intento 1. Rechaza ese nombre heredado en intentos posteriores y para el manifiesto v3.

Para `ref=main` con `rerun_group=all`, para referencias `release/*` y para referencias alfa de Tideclaw,
una ejecución general más reciente sustituye a una anterior con la misma referencia y
el mismo grupo de repetición. Cuando se cancela el flujo principal, su monitor cancela cualquier flujo de trabajo
secundario que ya haya iniciado. Las ejecuciones de validación con etiqueta y SHA fijado no
se cancelan entre sí.

## Etapas de las comprobaciones de la versión

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el destino
una vez y prepara un artefacto compartido `release-package-under-test` cuando lo necesitan
las etapas orientadas a paquetes o Docker.

| Etapa                    | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de la versión   | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro específico del conjunto de pruebas en vivo.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artefacto del paquete    | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y carga `release-package-under-test` para las comprobaciones posteriores relacionadas con el paquete.<br />**Reejecución:** el grupo afectado de paquete, multiplataforma o en vivo/E2E.                                                                                                                                                                                                                                                                                             |
| Prueba rápida de instalación | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo subyacente:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de la imagen de prueba rápida del Dockerfile raíz, instalación del paquete QR, pruebas rápidas de Docker raíz y del Gateway, pruebas del instalador en Docker y prueba rápida del proveedor de imágenes mediante instalación global con Bun.<br />**Reejecución:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Multiplataforma          | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo subyacente:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** vías de instalación nueva y actualización en Linux, Windows y macOS para el proveedor y el modo seleccionados, mediante el tarball candidato y un paquete de referencia.<br />**Reejecución:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E del repositorio y en vivo | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E del repositorio, caché en vivo, transmisión mediante websocket de OpenAI, fragmentos del proveedor nativo en vivo y de plugins, y bancos de pruebas en vivo respaldados por Docker para modelos, backends y el Gateway, seleccionados mediante `release_profile`.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` específico.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`.                                                                                |
| Ruta de publicación en Docker | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** bloques de Docker de la ruta de publicación ejecutados contra el artefacto de paquete compartido.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` específico.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Aceptación del paquete   | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo subyacente:** `Package Acceptance`<br />**Pruebas:** fixtures de paquetes de plugins sin conexión, actualización de plugins, el E2E canónico del paquete de Telegram con OpenAI simulado y comprobaciones de supervivencia tras la actualización desde versiones publicadas, todo contra el mismo tarball. Las comprobaciones de publicación bloqueantes usan de forma predeterminada la última versión publicada como referencia; las comprobaciones prolongadas (`run_release_soak=true`) se amplían a las 4 últimas versiones estables de npm más 3 versiones históricas fijadas (`2026.4.23`, `2026.5.2`, `2026.4.15`) y se ejecutan contra fixtures de actualización de incidencias notificadas.<br />**Reejecución:** `rerun_group=package`. |
| Cuadro de madurez        | **Trabajo:** `Render maturity scorecard release docs`<br />**Flujo de trabajo subyacente:** `maturity-scorecard.yml`<br />**Pruebas:** genera la documentación informativa del cuadro de madurez para la referencia objetivo. Solo se ejecuta cuando se proporciona `run_maturity_scorecard=true`.<br />**Reejecución:** `rerun_group=qa` con `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Paridad de QA            | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo subyacente:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica del candidato y la referencia, seguidos del informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Paridad del entorno de ejecución de QA | **Trabajo:** `Run QA Lab runtime parity lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** una vía de paridad agéntica para el par de entornos de ejecución `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), que incluye un nivel estándar y, con `run_release_soak=true`, un nivel prolongado. Informativo: los fallos individuales no bloquean el verificador de comprobaciones de publicación.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                    |
| Cobertura de herramientas del entorno de ejecución de QA | **Trabajo:** `Enforce QA Lab runtime tool coverage`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** desviación dinámica de herramientas entre `openclaw` y `codex` en el nivel estándar de paridad del entorno de ejecución (`pnpm openclaw qa coverage --tools`), mediante la salida de la vía de paridad del entorno de ejecución de QA. Bloqueante: este trabajo no puede anularse por ser informativo.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix en vivo de QA     | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** perfil rápido de QA en vivo de Matrix en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| Telegram en vivo de QA   | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** QA en vivo de Telegram con concesiones de credenciales de CI de Convex.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                      |
| Verificador de publicación | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** trabajos de comprobación de publicación obligatorios para el grupo de reejecución seleccionado.<br />**Reejecución:** volver a ejecutar después de que se completen correctamente los trabajos secundarios específicos.                                                                                                                                                                                                                                                                                                                                                                                   |

## Bloques de la ruta de publicación en Docker

La etapa de la ruta de publicación en Docker ejecuta estos bloques cuando
`live_suite_filter` está vacío:

| Bloque                                                          | Cobertura                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Vías principales de prueba rápida de la ruta de publicación en Docker.                                                                                      |
| `package-update-openai`                                         | Comportamiento de instalación y actualización del paquete de OpenAI, instalación bajo demanda de Codex, turnos en vivo del plugin de Codex y llamadas a herramientas de Chat Completions. |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización del paquete de Anthropic.                                                                             |
| `package-update-core`                                           | Comportamiento de paquetes y actualizaciones independiente del proveedor.                                                                              |
| `plugins-runtime-plugins`                                       | Vías del entorno de ejecución de plugins que ejercitan el comportamiento de los plugins.                                                                        |
| `plugins-runtime-services`                                      | Vías del entorno de ejecución de plugins en vivo y respaldadas por servicios.                                                                              |
| De `plugins-runtime-install-a` a `plugins-runtime-install-h`    | Lotes de instalación y entorno de ejecución de plugins divididos para validar la publicación en paralelo.                                                      |
| `openwebui`                                                     | Prueba rápida de compatibilidad con OpenWebUI aislada en un ejecutor dedicado con disco de gran capacidad cuando se solicita.                                    |

Use `docker_lanes=<lane[,lane]>` de forma específica en el flujo de trabajo reutilizable en vivo/E2E cuando
solo haya fallado una vía de Docker. Los artefactos de publicación incluyen comandos de reejecución
por vía con entradas para reutilizar el artefacto del paquete y la imagen cuando estén disponibles.

## Perfiles de publicación

`release_profile` controla principalmente la amplitud de proveedores y pruebas en vivo dentro de las comprobaciones de lanzamiento.
No elimina la CI completa normal, el prelanzamiento de Plugins, la prueba de humo de instalación, la
aceptación de paquetes ni QA Lab. Los perfiles estable y completo siempre ejecutan una cobertura exhaustiva
E2E del repositorio y en vivo, así como pruebas prolongadas de la ruta de lanzamiento con Docker. El perfil beta puede habilitarla con
`run_release_soak=true`. La aceptación de paquetes proporciona la prueba E2E canónica de Telegram para el paquete
de cada candidato completo, por lo que el flujo general no duplica ese
sondeador en vivo.

| Perfil   | Uso previsto                              | Cobertura de proveedores y pruebas en vivo incluida                                                                                                                                                    |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `beta`   | Prueba de humo crítica para el lanzamiento más rápida. | Ruta en vivo de OpenAI/núcleo, modelos en vivo de Docker para OpenAI, núcleo nativo del Gateway, perfil nativo del Gateway de OpenAI, Plugin nativo de OpenAI y Gateway en vivo de OpenAI con Docker. |
| `stable` | Perfil predeterminado de aprobación del lanzamiento. | `beta` más prueba de humo de Anthropic, Google, MiniMax, backend, arnés nativo de pruebas en vivo, backend de CLI en vivo con Docker, enlace ACP con Docker, arnés de Codex con Docker, anuncio de subagentes con Docker y un fragmento de prueba de humo de OpenCode Go. |
| `full`   | Barrido consultivo amplio.                | `stable` más proveedores consultivos, fragmentos en vivo de Plugins y fragmentos multimedia en vivo.                                                                                                   |

## Incorporaciones exclusivas del perfil completo

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                                      | Cobertura exclusiva del perfil completo                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Modelos en vivo de Docker                 | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                           |
| Gateway en vivo de Docker                 | Proveedores consultivos divididos en fragmentos de DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                 |
| Perfiles de proveedores del Gateway nativo | Fragmentos completos de Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, fragmentos completos de modelos OpenCode Go, OpenRouter, xAI y Z.ai. |
| Fragmentos en vivo de Plugins nativos     | Plugins A-K, L-N, otros O-Z, Moonshot y xAI.                                                                              |
| Fragmentos multimedia nativos en vivo     | Audio, música de Google, música de MiniMax y grupos de vídeo A-D.                                                         |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` utiliza en su lugar los fragmentos
más amplios de modelos Anthropic y OpenCode Go. Las repeticiones específicas aún pueden usar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Repeticiones específicas

Use `rerun_group` para evitar repetir entornos de lanzamiento no relacionados:

| Identificador         | Alcance                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `all`                 | Todas las etapas de validación completa del lanzamiento.                                          |
| `ci`                  | Solo el flujo secundario manual de CI completa.                                                   |
| `plugin-prerelease`   | Solo el flujo secundario de prelanzamiento de Plugins.                                            |
| `release-checks`      | Todas las etapas de comprobaciones de lanzamiento de OpenClaw.                                    |
| `install-smoke`       | Prueba de humo de instalación a través de las comprobaciones de lanzamiento.                      |
| `cross-os`            | Comprobaciones de lanzamiento entre sistemas operativos.                                          |
| `live-e2e`            | Validación E2E del repositorio y en vivo, y de la ruta de lanzamiento con Docker.                  |
| `package`             | Aceptación de paquetes.                                                                           |
| `qa`                  | Paridad de QA más carriles de QA en vivo.                                                         |
| `qa-parity`           | Solo los carriles y el informe de paridad de QA.                                                  |
| `qa-live`             | Matrix/Telegram de QA en vivo más los carriles condicionados de Discord, WhatsApp y Slack cuando están habilitados. |
| `npm-telegram`        | E2E de Telegram con el paquete publicado; requiere `release_package_spec` o `npm_telegram_package_spec`. |
| `performance`         | Solo evidencia de rendimiento del producto.                                                       |

Use `live_suite_filter` con `rerun_group=live-e2e` cuando falle una suite en vivo.
Los identificadores de filtro válidos se definen en el flujo reutilizable de pruebas en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador de repetición agregado para sus
tres fragmentos de proveedores, por lo que sigue distribuyéndose entre todos los trabajos consultivos del Gateway con Docker.

Use `cross_os_suite_filter` con `rerun_group=cross-os` cuando falle un carril
entre sistemas operativos. El filtro acepta un identificador de sistema operativo, un identificador de suite o un par de sistema operativo/suite, por
ejemplo, `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes entre sistemas operativos
incluyen tiempos por fase para los carriles de actualización empaquetada, y los comandos de larga duración
imprimen líneas de Heartbeat para que una actualización bloqueada sea visible antes de que se agote el tiempo de espera
del trabajo.

Los fallos de las comprobaciones de lanzamiento de QA bloquean la validación normal del lanzamiento. La comprobación de
cobertura de herramientas del entorno de ejecución de QA (divergencia dinámica de herramientas entre `openclaw` y `codex` en el
nivel estándar) también bloquea el verificador de comprobaciones de lanzamiento, aunque el
carril subyacente de paridad del entorno de ejecución de QA sea consultivo. Las ejecuciones alfa de Tideclaw aún pueden
tratar como consultivos los carriles de comprobación de lanzamiento que no afecten a la seguridad de los paquetes. Con
`release_profile=beta`, las suites de proveedores en vivo de `Run repo/live E2E validation`
son consultivas: las implementaciones de modelos de terceros cambian durante un lanzamiento, por lo que
beta muestra sus fallos como advertencias, mientras que los perfiles estable y completo los mantienen
como bloqueantes. Cuando
`live_suite_filter` solicita explícitamente un carril condicionado de QA en vivo, como Discord,
WhatsApp o Slack, debe estar habilitada la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
correspondiente; de lo contrario, la captura de entradas falla en vez de omitir silenciosamente el carril.
Repita `rerun_group=qa`, `qa-parity` o `qa-live` cuando
necesite evidencia de QA actualizada.

## Evidencia que debe conservarse

Conserve el resumen de `Full Release Validation` como índice del lanzamiento. Este enlaza
los identificadores de las ejecuciones secundarias e incluye tablas con los trabajos más lentos. En caso de fallo, inspeccione primero el
flujo de trabajo secundario y, a continuación, repita el identificador coincidente más específico de los anteriores.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de la ruta de lanzamiento con Docker en `.artifacts/docker-tests/`
- `package-under-test` de la aceptación de paquetes y artefactos de aceptación con Docker
- Artefactos de comprobación de lanzamiento entre sistemas operativos para cada sistema operativo y suite
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
