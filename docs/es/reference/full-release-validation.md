---
read_when:
    - Ejecutar o volver a ejecutar la validación completa de la versión
    - Comparación de los perfiles de validación de versiones estables y completas
    - Depuración de fallos en las etapas de validación de versiones
summary: Etapas de validación completa de la versión, flujos de trabajo secundarios, perfiles de versión, identificadores de repetición y evidencia
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-07-12T14:48:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de la versión: el único punto de entrada manual
para las pruebas previas a la publicación. La mayor parte del trabajo ocurre en flujos de trabajo secundarios para que un entorno con errores pueda
volver a ejecutarse sin reiniciar toda la publicación.

Ejecútelo desde una referencia de flujo de trabajo de confianza, normalmente `main`, y pase la rama de publicación,
la etiqueta o el SHA completo de la confirmación como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` también acepta `anthropic` o `minimax` para la incorporación entre sistemas operativos y el
turno de agente de extremo a extremo. Los trabajos secundarios reutilizables resuelven el entorno del flujo de trabajo invocado
desde `job.workflow_repository` y `job.workflow_sha`, mientras que la entrada `ref`
selecciona el candidato sometido a prueba. Esto mantiene disponible la lógica actual de validación
de confianza al validar una rama o etiqueta de una versión anterior.

Cada flujo secundario iniciado debe informar el mismo SHA de flujo de trabajo que la ejecución principal de
`Full Release Validation`. Si `main` cambia entre los inicios del flujo principal y los secundarios,
el paraguas aplica un cierre seguro incluso si el flujo secundario tiene éxito. Para
una prueba inmutable de una confirmación exacta, use
`pnpm ci:full-release --sha <target-sha>`. El auxiliar crea una referencia temporal
`release-ci/*` fijada al `origin/main` de confianza actual, pasa el SHA de destino
solo como la referencia candidata `ref`, reutiliza pruebas estrictas del destino exacto cuando
están disponibles y elimina la referencia después de la validación. Pase
`-f reuse_evidence=false` para forzar una ejecución nueva o
`--workflow-sha <trusted-main-sha>` para seleccionar una confirmación anterior del flujo de trabajo que aún sea
accesible desde el `origin/main` actual. El flujo de trabajo nunca crea ni actualiza
referencias del repositorio por sí mismo.

`release_profile=stable` y `release_profile=full` siempre ejecutan la prueba prolongada exhaustiva
en vivo/Docker. Pase `run_release_soak=true` para incluir las mismas fases de prueba prolongada
con el perfil `beta`. La publicación estable rechaza un manifiesto de validación
sin esta prueba prolongada y sin pruebas bloqueantes del rendimiento del producto.

Package Acceptance normalmente compila el tarball candidato desde la referencia
`ref` resuelta, incluidas las ejecuciones de SHA completo iniciadas con `pnpm ci:full-release`. Después de
una publicación beta, pase `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar
el paquete npm publicado en las comprobaciones de publicación, Package Acceptance, las pruebas entre sistemas operativos,
la ruta de publicación de Docker y Telegram con el paquete. Use `package_acceptance_package_spec`
solo cuando Package Acceptance deba probar intencionadamente un paquete diferente.
La fase del paquete en vivo del Plugin Codex sigue el mismo estado: los valores publicados de
`release_package_spec` derivan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada; y los operadores
pueden establecer `codex_plugin_spec` directamente para fuentes del Plugin
`npm:`, `npm-pack:` o `git:`. La fase concede la aprobación explícita de instalación de la CLI de Codex que
requiere ese Plugin y, después, ejecuta la comprobación previa de la CLI de Codex y turnos del agente OpenAI en la misma sesión.

## Etapas de nivel superior

Para `rerun_group=all`, primero se ejecuta un trabajo `Check for reusable validation evidence`:
busca la validación completa correcta más reciente para exactamente el mismo
SHA de destino, perfil de publicación, configuración efectiva de prueba prolongada y entradas de validación.
Cuando existen esas pruebas, se omiten todas las fases y el verificador del paraguas
vuelve a comprobar el artefacto inmutable del flujo principal, las ejecuciones secundarias y los registros de inicio. Esto es
solo una recuperación de reejecución para el mismo candidato; no autoriza la reutilización entre distintos SHA. Para
un candidato modificado, vuelva a ejecutar cada puerta de paquete, artefacto, instalación, Docker o proveedor
afectada por esa diferencia. Pase `reuse_evidence=false` para forzar una nueva ejecución
completa. La reutilización de pruebas solo se ejecuta desde `main` o desde una referencia canónica
`release-ci/*` fijada por SHA cuya confirmación del flujo de trabajo permanezca en el linaje de confianza de `main`;
otras referencias del flujo de trabajo ejecutan las fases seleccionadas desde cero.

También para `rerun_group=all`, un trabajo `Verify Docker runtime image assets` compila
el destino Docker `runtime-assets` con
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Se ejecuta en paralelo con las
demás etapas y el verificador del paraguas lo aplica; las fases ya no esperan a que
termine antes de iniciarse. Un `rerun_group` más específico omite esta comprobación previa.

| Etapa                   | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del destino       | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de publicación, la etiqueta o el SHA completo de la confirmación y registra las entradas seleccionadas.<br />**Reejecución:** vuelva a ejecutar el paraguas si esto falla.                                                                                                                                                                                                                                                                                                            |
| Comprobación previa de los recursos de Docker | **Trabajo:** `Verify Docker runtime image assets`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** el destino de compilación de Docker `runtime-assets` continúa funcionando correctamente antes de iniciar cualquier otra etapa. Solo se ejecuta para `rerun_group=all`.<br />**Reejecución:** vuelva a ejecutar el paraguas con `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest y CI normal    | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** el grafo manual completo de CI para la referencia de destino, incluidas las fases de Node en Linux, los fragmentos de Plugins incluidos, los fragmentos de contratos de Plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones de humo de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS, la i18n de Control UI y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`.                                                                                          |
| Versión preliminar de Plugins       | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de Plugins exclusivas de publicación, cobertura agéntica de Plugins, fragmentos completos por lotes de Plugins, fases Docker de versión preliminar de Plugins y un artefacto no bloqueante `plugin-inspector-advisory` para la clasificación de compatibilidad.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Comprobaciones de publicación          | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** prueba de humo de instalación, comprobaciones de paquetes entre sistemas operativos, Package Acceptance, paridad de QA Lab, Matrix en vivo y Telegram en vivo. Los perfiles estable y completo también ejecutan conjuntos exhaustivos de pruebas en vivo/E2E y fragmentos de la ruta de publicación de Docker; beta puede incluirlos con `run_release_soak=true`.<br />**Reejecución:** `rerun_group=release-checks` o un identificador más específico de las comprobaciones de publicación.                                                                |
| Telegram con el paquete        | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** una prueba E2E específica de Telegram con el paquete publicado cuando se establece `release_package_spec` o `npm_telegram_package_spec`. La validación completa del candidato utiliza en su lugar la prueba E2E canónica de Telegram de Package Acceptance.<br />**Reejecución:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                                                                                                              |
| Rendimiento del producto     | **Trabajo:** `Run product performance evidence`<br />**Flujo de trabajo secundario:** `OpenClaw Performance`<br />**Demuestra:** ejecución de rendimiento del perfil de publicación (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) para el SHA de destino. La salida de Kova permanece en los artefactos del flujo de trabajo y el flujo secundario debe demostrar que se omitió su publicador de informes. Se requiere (y es bloqueante) solo para `rerun_group=all` o `rerun_group=performance`; no se requiere para grupos de reejecución más específicos.<br />**Reejecución:** `rerun_group=performance`. |
| Verificador del paraguas       | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y agrega tablas de los trabajos más lentos de los flujos de trabajo secundarios.<br />**Reejecución:** vuelva a ejecutar solo este trabajo después de volver a ejecutar correctamente un flujo secundario que había fallado.                                                                                                                                                                                                                                                                 |

El paraguas siempre inicia el rendimiento del producto en modo de solo artefactos.
`OpenClaw Performance` permite publicar informes únicamente para ejecuciones programadas o un
inicio manual que establezca explícitamente `publish_reports=true`. La protección de solo artefactos
debe completarse correctamente, lo que demuestra que el trabajo del publicador permaneció omitido.
Las pruebas nuevas y reutilizadas registran
`controls.performanceReportPublication=artifact-only`; el verificador y el selector de reutilización
rechazan pruebas que no incluyan la prueba normalizada correspondiente del flujo secundario
de rendimiento.

El verificador carga el manifiesto canónico como
`full-release-validation-<run-id>-<run-attempt>`. Las herramientas de pruebas validan
su ID de artefacto, resumen, ejecución productora e intento antes de descargar exactamente ese
ID de artefacto. Limitan el ZIP descargado, verifican sus bytes con respecto al resumen
`sha256:` de REST y transmiten la única entrada permitida y limitada del manifiesto sin
extraer el archivo. Se mantiene temporalmente un alias de nombre estable para consumidores de
publicación anteriores. El verificador siempre prefiere el artefacto calificado por intento;
como transición, acepta el nombre estable solo para un productor del manifiesto v2
en el intento 1. Rechaza ese nombre heredado para intentos posteriores y para el manifiesto v3.

Para `ref=main` con `rerun_group=all`, para referencias `release/*` y para referencias alfa de Tideclaw,
una ejecución más reciente del paraguas reemplaza una anterior con la misma referencia y
el mismo grupo de reejecución. Cuando se cancela el flujo principal, su monitor cancela cualquier flujo de trabajo
secundario que ya haya iniciado. Las ejecuciones de validación con etiquetas y SHA fijados no
se cancelan entre sí.

## Etapas de comprobación de la publicación

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el destino
una sola vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas
orientadas a paquetes o Docker lo necesitan.

| Etapa                    | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de la versión           | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de repetición y filtro específico de la suite en vivo.<br />**Repetición:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artefacto del paquete         | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** empaqueta o resuelve un único tarball candidato y carga `release-package-under-test` para las comprobaciones posteriores relacionadas con el paquete.<br />**Repetición:** el grupo afectado de paquete, multiplataforma o en vivo/E2E.                                                                                                                                                                                                                                                                                             |
| Prueba rápida de instalación            | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo subyacente:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de la imagen de prueba rápida del Dockerfile raíz, instalación del paquete QR, pruebas rápidas de Docker de la raíz y del Gateway, pruebas de Docker del instalador y prueba rápida del proveedor de imágenes con instalación global mediante Bun.<br />**Repetición:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Multiplataforma                 | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo subyacente:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** carriles de instalación nueva y actualización en Linux, Windows y macOS para el proveedor y el modo seleccionados, utilizando el tarball candidato junto con un paquete de referencia.<br />**Repetición:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E del repositorio y en vivo        | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E del repositorio, caché en vivo, streaming mediante websocket de OpenAI, fragmentos del proveedor nativo en vivo y de plugins, y arneses de modelo/backend/gateway en vivo respaldados por Docker y seleccionados mediante `release_profile`.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o el grupo específico `rerun_group=live-e2e`.<br />**Repetición:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`.                                                                                |
| Ruta de versión de Docker      | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** bloques de Docker de la ruta de versión con el artefacto de paquete compartido.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o el grupo específico `rerun_group=live-e2e`.<br />**Repetición:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Aceptación del paquete       | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo subyacente:** `Package Acceptance`<br />**Pruebas:** fixtures sin conexión de paquetes de plugins, actualización de plugins, el E2E canónico del paquete de Telegram con OpenAI simulado y comprobaciones de supervivencia tras la actualización desde versiones publicadas utilizando el mismo tarball. Las comprobaciones de versión bloqueantes utilizan como referencia predeterminada la última versión publicada; las comprobaciones prolongadas (`run_release_soak=true`) se amplían a las últimas 4 versiones estables de npm más 3 versiones históricas fijadas (`2026.4.23`, `2026.5.2`, `2026.4.15`), ejecutadas con fixtures de actualización de incidencias notificadas.<br />**Repetición:** `rerun_group=package`. |
| Cuadro de indicadores de madurez       | **Trabajo:** `Render maturity scorecard release docs`<br />**Flujo de trabajo subyacente:** `maturity-scorecard.yml`<br />**Pruebas:** genera la documentación orientativa del cuadro de indicadores de madurez con la referencia objetivo. Solo se ejecuta cuando se proporciona `run_maturity_scorecard=true`.<br />**Repetición:** `rerun_group=qa` con `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Paridad de QA                | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo subyacente:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica del candidato y de referencia, seguidos del informe de paridad.<br />**Repetición:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Paridad del entorno de ejecución de QA        | **Trabajo:** `Run QA Lab runtime parity lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** un carril de paridad agéntica para el par de entornos de ejecución `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), que incluye un nivel estándar y, con `run_release_soak=true`, un nivel de prueba prolongada. Orientativo: los fallos individuales no bloquean el verificador de comprobaciones de versión.<br />**Repetición:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                    |
| Cobertura de herramientas del entorno de ejecución de QA | **Trabajo:** `Enforce QA Lab runtime tool coverage`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** desviación dinámica de herramientas entre `openclaw` y `codex` en el nivel estándar de paridad del entorno de ejecución (`pnpm openclaw qa coverage --tools`), utilizando la salida del carril de paridad del entorno de ejecución de QA. Bloqueante: este trabajo no se puede invalidar como orientativo.<br />**Repetición:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix en vivo de QA           | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** perfil rápido de QA de Matrix en vivo en el entorno `qa-live-shared`.<br />**Repetición:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| Telegram en vivo de QA         | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** QA de Telegram en vivo con concesiones de credenciales de Convex CI.<br />**Repetición:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                      |
| Verificador de la versión         | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** trabajos obligatorios de comprobación de la versión para el grupo de repetición seleccionado.<br />**Repetición:** repetir después de que se completen correctamente los trabajos secundarios específicos.                                                                                                                                                                                                                                                                                                                                                                                   |

## Bloques de la ruta de versión de Docker

La etapa de la ruta de versión de Docker ejecuta estos bloques cuando
`live_suite_filter` está vacío:

| Bloque                                                           | Cobertura                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Carriles principales de pruebas rápidas de la ruta de versión de Docker.                                                                                      |
| `package-update-openai`                                         | Comportamiento de instalación y actualización del paquete de OpenAI, instalación bajo demanda de Codex, interacciones en vivo del plugin de Codex y llamadas a herramientas de Chat Completions. |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización del paquete de Anthropic.                                                                             |
| `package-update-core`                                           | Comportamiento del paquete y de la actualización independiente del proveedor.                                                                              |
| `plugins-runtime-plugins`                                       | Carriles del entorno de ejecución de plugins que ejercitan el comportamiento de los plugins.                                                                        |
| `plugins-runtime-services`                                      | Carriles del entorno de ejecución de plugins respaldados por servicios y en vivo.                                                                              |
| De `plugins-runtime-install-a` a `plugins-runtime-install-h` | Lotes de instalación y ejecución de plugins divididos para validar la versión en paralelo.                                                      |
| `openwebui`                                                     | Prueba rápida de compatibilidad con OpenWebUI aislada en un ejecutor dedicado con un disco de gran capacidad cuando se solicita.                                    |

Utilice `docker_lanes=<lane[,lane]>` de forma específica en el flujo de trabajo reutilizable en vivo/E2E cuando
solo haya fallado un carril de Docker. Los artefactos de la versión incluyen, por cada carril, comandos
de repetición con entradas para reutilizar el artefacto del paquete y la imagen cuando estén disponibles.

## Perfiles de versión

`release_profile` controla principalmente la amplitud de proveedores y pruebas en vivo dentro de las comprobaciones de lanzamiento.
No elimina la CI completa normal, la versión preliminar de Plugin, la prueba rápida de instalación, la
aceptación de paquetes ni QA Lab. Los perfiles estable y completo siempre ejecutan una cobertura exhaustiva
de E2E del repositorio/en vivo y de pruebas prolongadas de la ruta de lanzamiento de Docker. El perfil beta puede habilitarla con
`run_release_soak=true`. La aceptación de paquetes proporciona la prueba E2E canónica de Telegram para el paquete
en cada candidato completo, por lo que el flujo general no duplica ese
sondeador en vivo.

| Perfil   | Uso previsto                                | Cobertura de proveedores y pruebas en vivo incluida                                                                                                                                                       |
| -------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Prueba rápida esencial para el lanzamiento. | Ruta en vivo de OpenAI/núcleo, modelos en vivo de Docker para OpenAI, núcleo del gateway nativo, perfil nativo de Gateway de OpenAI, Plugin nativo de OpenAI y Gateway en vivo de Docker para OpenAI.       |
| `stable` | Perfil predeterminado para aprobar lanzamientos. | `beta` más prueba rápida de Anthropic, Google, MiniMax, backend, conjunto de pruebas en vivo nativo, backend de CLI en vivo de Docker, vinculación ACP de Docker, conjunto de pruebas de Codex en Docker, anuncio de subagente en Docker y un fragmento de prueba rápida de OpenCode Go. |
| `full`   | Barrido consultivo amplio.                  | `stable` más proveedores consultivos, fragmentos de pruebas en vivo de plugins y fragmentos de pruebas multimedia en vivo.                                                                                |

## Incorporaciones exclusivas del perfil completo

Estos conjuntos se omiten en `stable` y se incluyen en `full`:

| Área                                    | Cobertura exclusiva del perfil completo                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Modelos en vivo de Docker               | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                                              |
| Gateway en vivo de Docker               | Proveedores consultivos divididos en fragmentos DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                                      |
| Perfiles de proveedor del Gateway nativo | Fragmentos completos Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, fragmentos completos de modelos OpenCode Go, OpenRouter, xAI y Z.ai. |
| Fragmentos de plugins nativos en vivo   | Plugins A-K, L-N, otros O-Z, Moonshot y xAI.                                                                                                 |
| Fragmentos multimedia nativos en vivo   | Audio, música de Google, música de MiniMax y grupos de vídeo A-D.                                                                             |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` utiliza en su lugar los fragmentos más amplios
de modelos Anthropic y OpenCode Go. Las repeticiones específicas aún pueden utilizar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Repeticiones específicas

Utilice `rerun_group` para evitar repetir entornos de lanzamiento no relacionados:

| Identificador         | Alcance                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `all`                 | Todas las etapas de validación completa del lanzamiento.                                                       |
| `ci`                  | Solo el proceso secundario manual de CI completa.                                                              |
| `plugin-prerelease`   | Solo el proceso secundario de versión preliminar de Plugin.                                                    |
| `release-checks`      | Todas las etapas de comprobaciones de lanzamiento de OpenClaw.                                                 |
| `install-smoke`       | Prueba rápida de instalación mediante comprobaciones de lanzamiento.                                          |
| `cross-os`            | Comprobaciones de lanzamiento entre sistemas operativos.                                                       |
| `live-e2e`            | E2E del repositorio/en vivo y validación de la ruta de lanzamiento de Docker.                                  |
| `package`             | Aceptación de paquetes.                                                                                        |
| `qa`                  | Paridad de QA más carriles de QA en vivo.                                                                      |
| `qa-parity`           | Solo carriles e informe de paridad de QA.                                                                      |
| `qa-live`             | Matrix/Telegram de QA en vivo más carriles condicionados de Discord, WhatsApp y Slack cuando están habilitados. |
| `npm-telegram`        | E2E de Telegram del paquete publicado; requiere `release_package_spec` o `npm_telegram_package_spec`.          |
| `performance`         | Solo evidencia de rendimiento del producto.                                                                   |

Use `live_suite_filter` con `rerun_group=live-e2e` cuando falle una suite en vivo.
Los identificadores de filtro válidos se definen en el flujo de trabajo reutilizable en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador de reejecución agregado para sus
tres particiones de proveedores, por lo que sigue distribuyéndose entre todos los trabajos informativos del Gateway en Docker.

Use `cross_os_suite_filter` con `rerun_group=cross-os` cuando falle una vía
multiplataforma. El filtro acepta un identificador de SO, un identificador de suite o un par SO/suite, por
ejemplo, `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes
multiplataforma incluyen los tiempos de cada fase para las vías de actualización mediante paquete, y los comandos
de larga duración imprimen líneas de Heartbeat para que una actualización bloqueada sea visible antes de que se
agote el tiempo de espera del trabajo.

Los fallos de las comprobaciones de versión de QA bloquean la validación normal de la versión. La comprobación de
cobertura de herramientas del entorno de ejecución de QA (divergencia dinámica de herramientas entre `openclaw` y `codex` en el
nivel estándar) también bloquea el verificador de comprobaciones de versión, aunque la
vía subyacente de paridad del entorno de ejecución de QA sea informativa. Las ejecuciones alfa de Tideclaw aún pueden
tratar como informativas las vías de comprobación de versión que no estén relacionadas con la seguridad de los paquetes. Con
`release_profile=beta`, las suites de proveedores en vivo de `Run repo/live E2E validation`
son informativas: las implementaciones de modelos de terceros cambian durante una versión, por lo que
el perfil beta muestra sus fallos como advertencias, mientras que los perfiles estable y completo los mantienen
como bloqueantes. Cuando
`live_suite_filter` solicita explícitamente una vía en vivo de QA controlada, como Discord,
WhatsApp o Slack, debe estar habilitada la variable del repositorio
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente; de lo contrario, la captura de entradas falla en vez de omitir silenciosamente la vía.
Vuelva a ejecutar `rerun_group=qa`, `qa-parity` o `qa-live` cuando
necesite evidencias de QA actualizadas.

## Evidencias que se deben conservar

Conserve el resumen de `Full Release Validation` como índice del nivel de versión. Incluye enlaces a
los identificadores de las ejecuciones secundarias y tablas de los trabajos más lentos. En caso de fallos, inspeccione primero el
flujo de trabajo secundario y, a continuación, vuelva a ejecutar el identificador coincidente más específico de los anteriores.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de la ruta de versión de Docker en `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance y artefactos de aceptación de Docker
- Artefactos de comprobación de versión multiplataforma para cada SO y suite
- Artefactos de paridad de QA, paridad del entorno de ejecución, Matrix y Telegram

## Archivos de flujos de trabajo

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
