---
read_when:
    - Ejecutar o volver a ejecutar la validación completa de la versión
    - Comparación de los perfiles de validación de versiones estable y completa
    - Depuración de fallos en la etapa de validación de la versión
summary: Etapas de la validación completa de lanzamiento, flujos de trabajo secundarios, perfiles de lanzamiento, identificadores de reejecución y evidencia
title: Validación completa de lanzamiento
x-i18n:
    generated_at: "2026-05-05T01:48:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de lanzamiento. Es el único punto de
entrada manual para la prueba previa al lanzamiento, pero la mayor parte del trabajo ocurre en flujos de trabajo secundarios, de modo que una
caja fallida pueda volver a ejecutarse sin reiniciar todo el lanzamiento.

Ejecútalo desde una referencia de flujo de trabajo confiable, normalmente `main`, y pasa la rama de lanzamiento,
etiqueta o SHA de confirmación completo como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Los flujos de trabajo secundarios usan la referencia de flujo de trabajo confiable para el arnés y el `ref` de entrada
para el candidato bajo prueba. Eso mantiene disponible la nueva lógica de validación
al validar una rama o etiqueta de lanzamiento más antigua.

De forma predeterminada, `release_profile=stable` ejecuta los carriles que bloquean el lanzamiento y omite
la prueba exhaustiva en vivo/Docker soak. Pasa `run_release_soak=true` para incluir los
carriles soak en una ejecución estable. `release_profile=full` siempre habilita los carriles soak para que
el perfil de asesoramiento amplio nunca pierda cobertura silenciosamente.

Package Acceptance normalmente crea el tarball candidato a partir del `ref`
resuelto, incluidas las ejecuciones con SHA completo despachadas con `pnpm ci:full-release`. Después de
publicar, pasa `package_acceptance_package_spec=openclaw@YYYY.M.D` (u
`openclaw@beta`/`openclaw@latest`) para ejecutar en su lugar la misma matriz de paquete/actualización contra
el paquete npm entregado.

## Etapas de nivel superior

| Etapa                | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución de objetivo    | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Prueba:** resuelve la rama de lanzamiento, la etiqueta o el SHA de confirmación completo, y registra las entradas seleccionadas.<br />**Reejecución:** vuelve a ejecutar el paraguas si esto falla.                                                                                                                                                                                                                               |
| Vitest y CI normal | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Prueba:** grafo de CI completo manual contra el ref objetivo, incluidos carriles de Node en Linux, fragmentos de Plugin incluidos, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, i18n de Control UI y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`.                                                  |
| Prelanzamiento de Plugin    | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Prueba:** comprobaciones estáticas de Plugin solo de lanzamiento, cobertura agentic de Plugin, fragmentos de lote completos de extensión y carriles Docker de prelanzamiento de Plugin.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| Comprobaciones de lanzamiento       | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Prueba:** smoke de instalación, comprobaciones de paquete entre sistemas operativos, Package Acceptance, paridad de QA Lab, Matrix en vivo y Telegram en vivo. Con `run_release_soak=true` o `release_profile=full`, también ejecuta suites exhaustivas en vivo/E2E y fragmentos de ruta de lanzamiento Docker.<br />**Reejecución:** `rerun_group=release-checks` o un identificador de release-checks más estrecho. |
| Artefacto de paquete     | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo secundario:** ninguno<br />**Prueba:** crea el tarball principal `release-package-under-test` lo bastante pronto para las comprobaciones orientadas a paquetes que no necesitan esperar a `OpenClaw Release Checks`.<br />**Reejecución:** vuelve a ejecutar el paraguas o proporciona `npm_telegram_package_spec` para `rerun_group=npm-telegram`.                                                                                    |
| Telegram de paquete     | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Prueba:** prueba de paquete Telegram respaldada por artefacto principal para `rerun_group=all` con `release_profile=full`, o prueba de Telegram con paquete publicado cuando `npm_telegram_package_spec` está establecido.<br />**Reejecución:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`.                                                                               |
| Verificador paraguas    | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Prueba:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y anexa tablas de los trabajos más lentos de los flujos de trabajo secundarios.<br />**Reejecución:** vuelve a ejecutar solo este trabajo después de volver a ejecutar un secundario fallido hasta que quede en verde.                                                                                                                                                                                    |

Para `ref=main` y `rerun_group=all`, un paraguas más nuevo reemplaza a uno más antiguo.
Cuando se cancela el padre, su monitor cancela cualquier flujo de trabajo secundario que ya haya
despachado. Las ejecuciones de validación de ramas y etiquetas de lanzamiento no se cancelan entre sí de forma
predeterminada.

## Etapas de comprobaciones de lanzamiento

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el objetivo
una vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas orientadas a paquetes
o Docker lo necesitan.

| Etapa               | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de release      | **Job:** `Resolve target ref`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** ref seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro de suite live enfocada.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefacto de paquete    | **Job:** `Prepare release package artifact`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y sube `release-package-under-test` para las comprobaciones posteriores orientadas a paquetes.<br />**Reejecución:** el grupo de paquete, cross-OS o live/E2E afectado.                                                                                                                                                                                                              |
| Smoke de instalación       | **Job:** `Run install smoke`<br />**Flujo de trabajo de respaldo:** `Install Smoke`<br />**Pruebas:** ruta completa de instalación con reutilización de imagen smoke del Dockerfile raíz, instalación del paquete QR, smokes de Docker raíz y Gateway, pruebas Docker del instalador, smoke de proveedor de imágenes con instalación global de Bun y E2E rápido de instalación/desinstalación de plugins incluidos.<br />**Reejecución:** `rerun_group=install-smoke`.                                                                                                                                 |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Flujo de trabajo de respaldo:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** carriles fresh y de actualización en Linux, Windows y macOS para el proveedor y el modo seleccionados, usando el tarball candidato más un paquete base.<br />**Reejecución:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repo y E2E live   | **Job:** `Run repo/live E2E validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E del repositorio, caché live, streaming de websocket de OpenAI, proveedor live nativo y shards de plugins, y arneses live respaldados por Docker para modelo/backend/Gateway seleccionados por `release_profile`.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` enfocado.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de release Docker | **Job:** `Run Docker release-path validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** chunks Docker de ruta de release contra el artefacto de paquete compartido.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` enfocado.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Aceptación de paquete  | **Job:** `Run package acceptance`<br />**Flujo de trabajo de respaldo:** `Package Acceptance`<br />**Pruebas:** fixtures de paquete de plugin offline, actualización de plugin, aceptación de paquete Telegram con OpenAI simulado y comprobaciones de supervivencia de actualización publicada contra el mismo tarball. Las comprobaciones de release bloqueantes usan la versión base publicada más reciente predeterminada; las comprobaciones soak se amplían a cada release estable de npm en o después de `2026.4.23` más fixtures de incidencias reportadas.<br />**Reejecución:** `rerun_group=package`.                          |
| Paridad de QA           | **Job:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo de respaldo:** jobs directos<br />**Pruebas:** paquetes de paridad agéntica candidato y base, y luego el informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix live de QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo de respaldo:** job directo<br />**Pruebas:** perfil de QA Matrix live rápido en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram live de QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo de respaldo:** job directo<br />**Pruebas:** QA live de Telegram con alquileres de credenciales de Convex CI.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Verificador de release    | **Job:** `Verify release checks`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** jobs de comprobación de release requeridos para el grupo de reejecución seleccionado.<br />**Reejecución:** reejecutar después de que pasen los jobs secundarios enfocados.                                                                                                                                                                                                                                                                                                    |

## Chunks de ruta de release Docker

La etapa de ruta de release Docker ejecuta estos chunks cuando `live_suite_filter` está
vacío:

| Chunk                                                           | Cobertura                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Carriles smoke de ruta de release Docker del núcleo.                                   |
| `package-update-openai`                                         | Comportamiento de instalación y actualización del paquete OpenAI.                             |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización del paquete Anthropic.                          |
| `package-update-core`                                           | Comportamiento de paquete y actualización neutral respecto al proveedor.                           |
| `plugins-runtime-plugins`                                       | Carriles de runtime de Plugin que ejercitan el comportamiento de plugins.                     |
| `plugins-runtime-services`                                      | Carriles de runtime de Plugin respaldados por servicios; incluye OpenWebUI cuando se solicita. |
| `plugins-runtime-install-a` hasta `plugins-runtime-install-h` | Lotes de instalación/runtime de plugins divididos para validación paralela de release.   |

Usa `docker_lanes=<lane[,lane]>` dirigido en el flujo de trabajo live/E2E reutilizable cuando
solo falló un carril Docker. Los artefactos de release incluyen comandos de reejecución
por carril con entradas de artefacto de paquete y reutilización de imágenes cuando están disponibles.

## Perfiles de release

`release_profile` controla principalmente la amplitud live/proveedor dentro de las comprobaciones de release.
No elimina CI completa normal, Plugin Prerelease, smoke de instalación, aceptación de
paquete ni QA Lab. Para `stable`, E2E exhaustivo de repo/live y los chunks de
ruta de release Docker son cobertura soak y se ejecutan cuando `run_release_soak=true`.
`full` fuerza la activación de la cobertura soak y también hace que la ejecución paraguas ejecute E2E de paquete Telegram
contra el artefacto de paquete de release padre cuando `rerun_group=all`, de modo que un candidato completo
previo a la publicación no omita silenciosamente ese carril de paquete Telegram.

| Perfil   | Uso previsto                      | Cobertura live/proveedor incluida                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke crítico de release más rápido.   | Ruta live de OpenAI/núcleo, modelos live Docker para OpenAI, núcleo de Gateway nativo, perfil de Gateway OpenAI nativo, plugin OpenAI nativo y Gateway OpenAI live Docker.                     |
| `stable`  | Perfil predeterminado de aprobación de release. | `minimum` más smoke de Anthropic, Google, MiniMax, backend, arnés de pruebas live nativo, backend CLI live Docker, enlace ACP Docker, arnés Codex Docker y un shard smoke de OpenCode Go. |
| `full`    | Barrido amplio de asesoría.             | `stable` más proveedores de asesoría, shards live de plugins y shards live de medios.                                                                                                        |

## Adiciones solo de full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo de full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                          |
| Gateway live Docker              | Proveedores de asesoría divididos en shards DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                              |
| Perfiles de proveedor de Gateway nativo | Shards completos de Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI y Z.ai. |
| Shards live de plugins nativos        | Plugins A-K, L-N, O-Z otros, Moonshot y xAI.                                                                             |
| Shards live de medios nativos         | Audio, música de Google, música de MiniMax y grupos de video A-D.                                                                   |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa en su lugar los shards
más amplios de modelo Anthropic y OpenCode Go. Las reejecuciones enfocadas aún pueden usar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Reejecuciones enfocadas

Usa `rerun_group` para evitar repetir cajas de release no relacionadas:

| Identificador       | Alcance                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Todas las etapas de Validación completa de lanzamiento.               |
| `ci`                | Solo el subflujo de CI completa manual.                               |
| `plugin-prerelease` | Solo el subflujo de prelanzamiento de Plugin.                         |
| `release-checks`    | Todas las etapas de Comprobaciones de lanzamiento de OpenClaw.        |
| `install-smoke`     | Install Smoke mediante comprobaciones de lanzamiento.                 |
| `cross-os`          | Comprobaciones de lanzamiento entre sistemas operativos.              |
| `live-e2e`          | Validación de E2E del repositorio/en vivo y de la ruta de lanzamiento de Docker. |
| `package`           | Aceptación de paquetes.                                               |
| `qa`                | Paridad de QA más carriles en vivo de QA.                             |
| `qa-parity`         | Solo carriles de paridad de QA e informe.                             |
| `qa-live`           | Solo Matrix y Telegram en vivo de QA.                                 |
| `npm-telegram`      | E2E de Telegram con paquete publicado; requiere `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando falle una sola suite en vivo.
Los identificadores de filtro válidos se definen en el flujo de trabajo reutilizable en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador de repetición agregado para sus
tres fragmentos de proveedor, por lo que aún se distribuye a todos los trabajos de Gateway de asesoría de Docker.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` cuando falle un solo carril
entre sistemas operativos. El filtro acepta un id. de SO, un id. de suite o un par SO/suite, por
ejemplo `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes entre sistemas operativos
incluyen tiempos por fase para los carriles de actualización empaquetada, y los comandos de larga duración
imprimen líneas de Heartbeat para que una actualización de Windows bloqueada sea visible antes de que se agote
el tiempo de espera del trabajo.

Los carriles de comprobación de lanzamiento de QA son consultivos. Un fallo solo de QA se informa como advertencia
y no bloquea el verificador de comprobaciones de lanzamiento; vuelve a ejecutar `rerun_group=qa`,
`qa-parity` o `qa-live` cuando necesites evidencia nueva de QA.

## Evidencia que conservar

Conserva el resumen de `Full Release Validation` como índice de nivel de lanzamiento. Enlaza
ids. de ejecuciones secundarias e incluye tablas de los trabajos más lentos. Para fallos, inspecciona primero el flujo de trabajo
secundario y luego vuelve a ejecutar el identificador coincidente más pequeño anterior.

Artefactos útiles:

- `release-package-under-test` del flujo principal de Validación completa de lanzamiento y `OpenClaw Release Checks`
- Artefactos de ruta de lanzamiento de Docker en `.artifacts/docker-tests/`
- `package-under-test` de Aceptación de paquetes y artefactos de aceptación de Docker
- Artefactos de comprobación de lanzamiento entre sistemas operativos para cada SO y suite
- Artefactos de paridad de QA, Matrix y Telegram

## Archivos de flujo de trabajo

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
