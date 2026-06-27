---
read_when:
    - Ejecutar o volver a ejecutar la validación completa de la versión
    - Comparación de perfiles de validación de versiones estables y completas
    - Depuración de fallos en la etapa de validación de la versión
summary: Etapas de validación de la versión completa, flujos de trabajo secundarios, perfiles de versión, identificadores de repetición y evidencias
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-06-27T12:50:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de la publicación. Es el único punto de entrada
manual para la prueba previa a la publicación, pero la mayor parte del trabajo ocurre en flujos
de trabajo secundarios para que una máquina fallida pueda volver a ejecutarse sin reiniciar toda la publicación.

Ejecútalo desde una referencia de flujo de trabajo confiable, normalmente `main`, y pasa la rama de publicación,
la etiqueta o el SHA completo del commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Los flujos de trabajo secundarios usan la referencia de flujo de trabajo confiable para el arnés y la entrada
`ref` para el candidato bajo prueba. Eso mantiene disponible la nueva lógica de validación
al validar una rama o etiqueta de publicación anterior.

`release_profile=stable` y `release_profile=full` siempre ejecutan el soak exhaustivo
en vivo/Docker. Pasa `run_release_soak=true` para incluir las mismas vías de soak
con el perfil beta. La publicación estable rechaza un manifiesto de validación sin este
soak y sin evidencia bloqueante de rendimiento del producto.

Aceptación de paquetes normalmente construye el tarball candidato desde la
`ref` resuelta, incluidas las ejecuciones con SHA completo despachadas con `pnpm ci:full-release`. Después de una
publicación beta, pasa `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar el
paquete npm publicado en las comprobaciones de publicación, Aceptación de paquetes, sistemas operativos cruzados,
Docker de ruta de publicación y paquete Telegram. Usa `package_acceptance_package_spec`
solo cuando Aceptación de paquetes deba demostrar intencionalmente un paquete diferente.
La vía de paquete en vivo del Plugin de Codex sigue el mismo estado: los valores publicados de
`release_package_spec` derivan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
las ejecuciones con SHA/artefacto empaquetan `extensions/codex` desde la ref seleccionada; y los operadores
pueden definir `codex_plugin_spec` directamente para fuentes de Plugin `npm:`, `npm-pack:` o `git:`.
La vía concede la aprobación explícita de instalación de Codex CLI requerida por
ese Plugin, luego ejecuta la comprobación previa de Codex CLI y turnos de agente OpenAI en la misma sesión.

## Etapas de nivel superior

| Etapa                | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Resolución del objetivo    | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de publicación, la etiqueta o el SHA completo del commit y registra las entradas seleccionadas.<br />**Reejecución:** vuelve a ejecutar el paraguas si esto falla.                                                                                                                                                                                                                                             |
| Vitest y CI normal | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** grafo manual completo de CI contra la ref objetivo, incluidas vías de Linux Node, shards de Plugin incluidos, shards de contratos de Plugin y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos construidos, comprobaciones de documentación, Skills de Python, Windows, macOS, i18n de Control UI y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`.                           |
| Versión preliminar de Plugin    | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de Plugin solo para publicación, cobertura agéntica de Plugin, shards completos de lotes de extensiones, vías Docker de versión preliminar de Plugin y un artefacto no bloqueante `plugin-inspector-advisory` para triaje de compatibilidad.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                                        |
| Comprobaciones de publicación       | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** smoke de instalación, comprobaciones de paquete entre sistemas operativos, Aceptación de paquetes, paridad de QA Lab, Matrix en vivo y Telegram en vivo. Los perfiles estable y completo también ejecutan suites exhaustivas en vivo/E2E y fragmentos Docker de ruta de publicación; beta puede optar por incluirlos con `run_release_soak=true`.<br />**Reejecución:** `rerun_group=release-checks` o un identificador más específico de release-checks. |
| Paquete Telegram     | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** un E2E de Telegram enfocado en paquete publicado cuando `release_package_spec` o `npm_telegram_package_spec` está definido. La validación completa del candidato usa en su lugar el E2E de Telegram canónico de Aceptación de paquetes.<br />**Reejecución:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                                               |
| Verificador paraguas    | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de ejecuciones secundarias y agrega tablas de trabajos más lentos desde los flujos de trabajo secundarios.<br />**Reejecución:** vuelve a ejecutar solo este trabajo después de volver a ejecutar un secundario fallido hasta que quede en verde.                                                                                                                                                                                                  |

Para `ref=main` y `rerun_group=all`, un paraguas más nuevo reemplaza a uno anterior.
Cuando el padre se cancela, su monitor cancela cualquier flujo de trabajo secundario que ya
haya despachado. Las ejecuciones de validación de ramas y etiquetas de publicación no se cancelan entre sí
de forma predeterminada.

## Etapas de comprobaciones de publicación

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el objetivo
una vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas orientadas
a paquetes o Docker lo necesitan.

| Etapa               | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de lanzamiento | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de repetición y filtro enfocado de suite en vivo.<br />**Repetición:** `rerun_group=release-checks`.                                                                                                                                                                                                                          |
| Artefacto de paquete | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y sube `release-package-under-test` para las comprobaciones posteriores orientadas al paquete.<br />**Repetición:** el paquete afectado, el grupo multiplataforma, o el grupo en vivo/E2E.                                                                                                                                         |
| Smoke de instalación | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo de respaldo:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de la imagen smoke del Dockerfile raíz, instalación del paquete QR, smokes Docker de raíz y Gateway, pruebas Docker del instalador, smoke del proveedor de imágenes con instalación global de Bun, y E2E rápido de instalación/desinstalación de Plugin incluido.<br />**Repetición:** `rerun_group=install-smoke`. |
| Multiplataforma     | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo de respaldo:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** carriles nuevos y de actualización en Linux, Windows y macOS para el proveedor y modo seleccionados, usando el tarball candidato más un paquete de referencia.<br />**Repetición:** `rerun_group=cross-os`.                                                                                                                                       |
| E2E de repo y en vivo | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E del repositorio, caché en vivo, streaming websocket de OpenAI, proveedor nativo en vivo y shards de Plugin, y arneses Docker en vivo de modelo/backend/Gateway seleccionados por `release_profile`.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full`, o `rerun_group=live-e2e` enfocado.<br />**Repetición:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de lanzamiento Docker | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** fragmentos Docker de ruta de lanzamiento contra el artefacto de paquete compartido.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full`, o `rerun_group=live-e2e` enfocado.<br />**Repetición:** `rerun_group=live-e2e`.                                                                                       |
| Aceptación de paquetes | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo de respaldo:** `Package Acceptance`<br />**Pruebas:** fixtures de paquete de Plugin sin conexión, actualización de Plugin, E2E canónico de paquete mock-OpenAI Telegram, y comprobaciones de supervivencia de actualización publicada contra el mismo tarball. Las comprobaciones bloqueantes de lanzamiento usan la referencia publicada más reciente predeterminada; las comprobaciones soak se expanden a cada lanzamiento estable de npm en o después de `2026.4.23` más fixtures de incidencias reportadas.<br />**Repetición:** `rerun_group=package`. |
| Paridad de QA       | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo de respaldo:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica de candidato y referencia, luego el informe de paridad.<br />**Repetición:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                 |
| Matrix en vivo de QA | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** perfil rápido de QA de Matrix en vivo en el entorno `qa-live-shared`.<br />**Repetición:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                      |
| Telegram en vivo de QA | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** QA de Telegram en vivo con alquileres de credenciales de CI de Convex.<br />**Repetición:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                  |
| Verificador de lanzamiento | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** trabajos obligatorios de comprobación de lanzamiento para el grupo de repetición seleccionado.<br />**Repetición:** repetir después de que pasen los trabajos secundarios enfocados.                                                                                                                                                                                                    |

## Fragmentos de ruta de lanzamiento Docker

La etapa de ruta de lanzamiento Docker ejecuta estos fragmentos cuando `live_suite_filter` está
vacío:

| Fragmento                                                       | Cobertura                                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Carriles smoke de ruta de lanzamiento Docker del núcleo.                                                                   |
| `package-update-openai`                                         | Comportamiento de instalación/actualización de paquete OpenAI, instalación bajo demanda de Codex, turnos en vivo del Plugin Codex y llamadas de herramientas de Chat Completions. |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización de paquete Anthropic.                                                        |
| `package-update-core`                                           | Comportamiento de paquete y actualización neutral respecto al proveedor.                                                   |
| `plugins-runtime-plugins`                                       | Carriles de runtime de Plugin que ejercitan comportamiento de Plugin.                                                      |
| `plugins-runtime-services`                                      | Carriles de runtime de Plugin respaldados por servicios y en vivo; incluye OpenWebUI cuando se solicita.                  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalación/runtime de Plugin divididos para validación de lanzamiento en paralelo.                               |

Usa `docker_lanes=<lane[,lane]>` dirigido en el flujo de trabajo reutilizable en vivo/E2E cuando
solo haya fallado un carril Docker. Los artefactos de lanzamiento incluyen comandos de repetición
por carril con entradas de artefacto de paquete y reutilización de imagen cuando están disponibles.

## Perfiles de lanzamiento

`release_profile` controla principalmente la amplitud en vivo/de proveedores dentro de las comprobaciones de lanzamiento.
No elimina la CI completa normal, Plugin Prerelease, smoke de instalación, aceptación de paquetes
ni QA Lab. Los perfiles estable y completo siempre ejecutan cobertura exhaustiva de soak
E2E de repo/en vivo y de ruta de lanzamiento Docker. El perfil beta puede optar por incluirla con
`run_release_soak=true`. Package Acceptance proporciona el E2E canónico de paquete
Telegram para cada candidato completo, por lo que el paraguas no duplica ese
poller en vivo.

| Perfil   | Uso previsto                      | Cobertura en vivo/de proveedores incluida                                                                                                                                           |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke crítico de lanzamiento más rápido. | Ruta en vivo OpenAI/núcleo, modelos en vivo Docker para OpenAI, núcleo de Gateway nativo, perfil de Gateway OpenAI nativo, Plugin OpenAI nativo y Gateway OpenAI en vivo Docker. |
| `stable`  | Perfil predeterminado de aprobación de lanzamiento. | `minimum` más smoke de Anthropic, Google, MiniMax, backend, arnés de pruebas nativo en vivo, backend CLI en vivo Docker, enlace ACP Docker, arnés Codex Docker y un shard smoke de OpenCode Go. |
| `full`    | Barrido consultivo amplio.        | `stable` más proveedores consultivos, shards en vivo de Plugin y shards en vivo de medios.                                                                                          |

## Adiciones solo para full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo para full                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos en vivo Docker           | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                            |
| Gateway en vivo Docker           | Proveedores consultivos divididos en shards DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                         |
| Perfiles de proveedor de Gateway nativo | Shards completos de Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelos OpenCode Go, OpenRouter, xAI y Z.ai. |
| Shards en vivo de Plugin nativo  | Plugins A-K, L-N, O-Z otros, Moonshot y xAI.                                                                               |
| Shards en vivo de medios nativos | Audio, música de Google, música de MiniMax y grupos de video A-D.                                                          |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa en su lugar los shards de modelos
Anthropic y OpenCode Go más amplios. Las repeticiones enfocadas aún pueden usar los identificadores
agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Repeticiones enfocadas

Usa `rerun_group` para evitar repetir cuadros de lanzamiento no relacionados:

| Identificador       | Alcance                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `all`               | Todas las etapas de Validación completa de lanzamiento.                                                     |
| `ci`                | Solo el hijo de CI completa manual.                                                                         |
| `plugin-prerelease` | Solo el hijo de prelanzamiento de Plugin.                                                                   |
| `release-checks`    | Todas las etapas de Comprobaciones de lanzamiento de OpenClaw.                                              |
| `install-smoke`     | Prueba smoke de instalación mediante comprobaciones de lanzamiento.                                         |
| `cross-os`          | Comprobaciones de lanzamiento entre sistemas operativos.                                                    |
| `live-e2e`          | Validación E2E de repositorio/en vivo y de ruta de lanzamiento de Docker.                                   |
| `package`           | Aceptación de paquete.                                                                                      |
| `qa`                | Paridad de QA más carriles de QA en vivo.                                                                   |
| `qa-parity`         | Solo carriles e informe de paridad de QA.                                                                   |
| `qa-live`           | Matrix/Telegram de QA en vivo más carriles con compuerta de Discord, WhatsApp y Slack cuando están activos. |
| `npm-telegram`      | E2E de Telegram para paquete publicado; requiere `release_package_spec` o `npm_telegram_package_spec`.      |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando haya fallado una suite en vivo.
Los ids de filtro válidos se definen en el flujo de trabajo reutilizable en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador de repetición agregado para sus
tres fragmentos de proveedor, por lo que sigue desplegándose a todos los trabajos de Gateway Docker de aviso.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` cuando haya fallado un carril entre sistemas operativos.
El filtro acepta un id de sistema operativo, un id de suite o un par sistema operativo/suite, por
ejemplo `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes entre sistemas operativos
incluyen tiempos por fase para los carriles de actualización empaquetada, y los comandos de larga duración
imprimen líneas de Heartbeat para que una actualización de Windows atascada sea visible antes del
tiempo de espera del trabajo.

Los fallos de comprobaciones de lanzamiento de QA bloquean la validación normal de lanzamiento. La deriva requerida
de herramientas dinámicas de OpenClaw en el nivel estándar también bloquea el verificador de comprobaciones de lanzamiento.
Las ejecuciones alfa de Tideclaw aún pueden tratar los carriles de comprobaciones de lanzamiento que no son de seguridad
de paquete como avisos. Cuando `live_suite_filter` solicita explícitamente un carril de QA en vivo con compuerta, como
Discord, WhatsApp o Slack, la variable del repositorio
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente debe estar habilitada; de lo contrario,
la captura de entrada falla en lugar de omitir silenciosamente el carril. Vuelve a ejecutar `rerun_group=qa`,
`qa-parity` o `qa-live` cuando necesites evidencia de QA nueva.

## Evidencia que conservar

Conserva el resumen `Full Release Validation` como índice de nivel de lanzamiento. Enlaza
los ids de ejecuciones hijas e incluye tablas de trabajos más lentos. Para los fallos, inspecciona primero el
flujo de trabajo hijo y luego vuelve a ejecutar el identificador coincidente más pequeño de arriba.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de ruta de lanzamiento de Docker en `.artifacts/docker-tests/`
- `package-under-test` de Aceptación de paquete y artefactos de aceptación de Docker
- Artefactos de comprobaciones de lanzamiento entre sistemas operativos para cada sistema operativo y suite
- Artefactos de paridad de QA, Matrix y Telegram

## Archivos de flujo de trabajo

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
