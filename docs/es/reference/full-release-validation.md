---
read_when:
    - Ejecutar o volver a ejecutar la validación completa de lanzamiento
    - Comparación de los perfiles de validación de lanzamiento estable y completo
    - Depuración de fallos en la etapa de validación de lanzamiento
summary: Etapas de validación de lanzamiento completo, flujos de trabajo secundarios, perfiles de lanzamiento, identificadores de reejecución y evidencia
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-05-11T20:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el proceso paraguas de lanzamiento. Es el único
punto de entrada manual para la prueba previa al lanzamiento, pero la mayor
parte del trabajo ocurre en flujos de trabajo secundarios para que una máquina
fallida pueda volver a ejecutarse sin reiniciar todo el lanzamiento.

Ejecútalo desde una referencia de flujo de trabajo de confianza, normalmente `main`, y pasa la rama de lanzamiento,
la etiqueta o el SHA completo del commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Los flujos de trabajo secundarios usan la referencia de flujo de trabajo de confianza para el arnés y el
`ref` de entrada para el candidato en prueba. Eso mantiene disponible la nueva lógica de validación
cuando se valida una rama o etiqueta de lanzamiento anterior.

De forma predeterminada, `release_profile=stable` ejecuta las vías que bloquean el lanzamiento y omite
la prueba exhaustiva en vivo/Docker prolongada. Pasa `run_release_soak=true` para incluir las
vías prolongadas en una ejecución estable. `release_profile=full` siempre habilita las vías prolongadas para que
el perfil de asesoramiento amplio nunca pierda cobertura silenciosamente.

Package Acceptance normalmente compila el tarball candidato a partir del
`ref` resuelto, incluidas las ejecuciones con SHA completo despachadas con `pnpm ci:full-release`. Después de una
publicación beta, pasa `release_package_spec=openclaw@YYYY.M.D-beta.N` para reutilizar el paquete npm
publicado en las comprobaciones de lanzamiento, Package Acceptance, sistemas operativos cruzados,
Docker de ruta de lanzamiento y Telegram de paquete. Usa `package_acceptance_package_spec`
solo cuando Package Acceptance deba probar intencionalmente un paquete diferente.

## Etapas de nivel superior

| Etapa                | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del destino | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de lanzamiento, la etiqueta o el SHA completo del commit y registra las entradas seleccionadas.<br />**Reejecución:** vuelve a ejecutar el paraguas si esto falla.                                                                                                                                                                                                                               |
| Vitest y CI normal | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** grafo manual de CI completo contra la referencia de destino, incluidas vías de Node en Linux, fragmentos de Plugin incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, prueba básica de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, i18n de Control UI y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`.                                                  |
| Prelanzamiento de Plugin | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de Plugin solo de lanzamiento, cobertura agéntica de Plugin, fragmentos de lote completo de extensiones, vías Docker de prelanzamiento de Plugin y un artefacto no bloqueante `plugin-inspector-advisory` para la clasificación de compatibilidad.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                          |
| Comprobaciones de lanzamiento       | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** prueba básica de instalación, comprobaciones de paquete en sistemas operativos cruzados, Package Acceptance, paridad de QA Lab, Matrix en vivo y Telegram en vivo. Con `run_release_soak=true` o `release_profile=full`, también ejecuta suites exhaustivas en vivo/E2E y fragmentos Docker de ruta de lanzamiento.<br />**Reejecución:** `rerun_group=release-checks` o un identificador más específico de comprobaciones de lanzamiento. |
| Artefacto del paquete     | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** crea el tarball principal `release-package-under-test` lo bastante pronto para las comprobaciones orientadas a paquetes que no necesitan esperar a `OpenClaw Release Checks`.<br />**Reejecución:** vuelve a ejecutar el paraguas o proporciona `release_package_spec` para reejecuciones de paquete publicado.                                                                                           |
| Telegram de paquete     | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** prueba de paquete de Telegram respaldada por artefacto principal para `rerun_group=all` con `release_profile=full`, o prueba de Telegram de paquete publicado cuando se establece `release_package_spec` o `npm_telegram_package_spec`.<br />**Reejecución:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                           |
| Verificador paraguas    | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y añade tablas de trabajos más lentos de los flujos de trabajo secundarios.<br />**Reejecución:** vuelve a ejecutar solo este trabajo después de volver a ejecutar un flujo secundario fallido hasta que quede en verde.                                                                                                                                                                                    |

Para `ref=main` y `rerun_group=all`, un paraguas más reciente reemplaza a uno anterior.
Cuando se cancela el principal, su monitor cancela cualquier flujo de trabajo secundario que ya haya
despachado. Las ejecuciones de validación de ramas y etiquetas de lanzamiento no se cancelan entre sí
de forma predeterminada.

## Etapas de comprobaciones de lanzamiento

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el destino
una vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas
orientadas a paquetes o Docker lo necesitan.

| Etapa               | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de la versión      | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro enfocado de suite en vivo.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefacto del paquete    | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y sube `release-package-under-test` para las comprobaciones descendentes orientadas a paquetes.<br />**Reejecución:** el grupo afectado de paquete, multi-OS o en vivo/E2E.                                                                                                                                                                                                              |
| Smoke de instalación       | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo subyacente:** `Install Smoke`<br />**Pruebas:** ruta completa de instalación con reutilización de la imagen smoke del Dockerfile raíz, instalación del paquete QR, smokes de Docker raíz y Gateway, pruebas de Docker del instalador, smoke de proveedor de imágenes de instalación global con Bun y E2E rápido de instalación/desinstalación de Plugin incluido.<br />**Reejecución:** `rerun_group=install-smoke`.                                                                                                                                 |
| Multi-OS            | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo subyacente:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** carriles de instalación fresca y actualización en Linux, Windows y macOS para el proveedor y modo seleccionados, usando el tarball candidato más un paquete de referencia.<br />**Reejecución:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repositorio y E2E en vivo   | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E de repositorio, caché en vivo, streaming por websocket de OpenAI, shards nativos de proveedor en vivo y Plugin, y arneses de modelo/backend/Gateway en vivo respaldados por Docker seleccionados por `release_profile`.<br />**Se ejecuta:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` enfocado.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de versión de Docker | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo subyacente:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** fragmentos de Docker de ruta de versión contra el artefacto de paquete compartido.<br />**Se ejecuta:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` enfocado.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Aceptación de paquetes  | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo subyacente:** `Package Acceptance`<br />**Pruebas:** fixtures offline de paquetes de Plugin, actualización de Plugin, aceptación de paquete de Telegram con mock de OpenAI y comprobaciones de supervivencia de actualización publicada contra el mismo tarball. Las comprobaciones bloqueantes de versión usan la referencia publicada más reciente de forma predeterminada; las comprobaciones soak se expanden a cada versión estable de npm en o después de `2026.4.23` más fixtures de incidencias reportadas.<br />**Reejecución:** `rerun_group=package`.                          |
| Paridad de QA           | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo subyacente:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica candidato y de referencia, y luego el informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix en vivo de QA      | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** perfil rápido de QA de Matrix en vivo en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram en vivo de QA    | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo subyacente:** trabajo directo<br />**Pruebas:** QA de Telegram en vivo con concesiones de credenciales de CI de Convex.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Verificador de versión    | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo subyacente:** ninguno<br />**Pruebas:** trabajos requeridos de comprobación de versión para el grupo de reejecución seleccionado.<br />**Reejecución:** reejecutar después de que pasen los trabajos secundarios enfocados.                                                                                                                                                                                                                                                                                                    |

## Fragmentos de ruta de versión de Docker

La etapa de ruta de versión de Docker ejecuta estos fragmentos cuando `live_suite_filter` está
vacío:

| Fragmento                                                           | Cobertura                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Carriles smoke principales de ruta de versión de Docker.                                                             |
| `package-update-openai`                                         | Comportamiento de instalación/actualización del paquete OpenAI, instalación bajo demanda de Codex y llamadas a herramientas de Chat Completions. |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización del paquete Anthropic.                                                    |
| `package-update-core`                                           | Comportamiento de paquete y actualización independiente del proveedor.                                                     |
| `plugins-runtime-plugins`                                       | Carriles de runtime de Plugin que ejercitan el comportamiento de Plugin.                                               |
| `plugins-runtime-services`                                      | Carriles de runtime de Plugin respaldados por servicios y en vivo; incluye OpenWebUI cuando se solicita.                  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalación/runtime de Plugin divididos para validación paralela de versión.                             |

Usa `docker_lanes=<lane[,lane]>` dirigido en el flujo de trabajo reutilizable en vivo/E2E cuando
solo falló un carril de Docker. Los artefactos de versión incluyen comandos de reejecución
por carril con entradas de artefacto de paquete y reutilización de imagen cuando están disponibles.

## Perfiles de versión

`release_profile` controla principalmente la amplitud de en vivo/proveedor dentro de las comprobaciones de versión.
No elimina la CI completa normal, Plugin Prerelease, smoke de instalación, aceptación de paquetes
ni QA Lab. Para `stable`, el E2E exhaustivo de repositorio/en vivo y los fragmentos de
ruta de versión de Docker son cobertura soak y se ejecutan cuando `run_release_soak=true`.
`full` fuerza la cobertura soak y también hace que la ejecución paraguas ejecute el E2E de paquete de Telegram
contra el artefacto de paquete de versión padre cuando `rerun_group=all`, para que un candidato
completo previo a la publicación no omita silenciosamente ese carril de paquete de Telegram.

| Perfil   | Uso previsto                      | Cobertura incluida de en vivo/proveedor                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke crítico de versión más rápido.   | Ruta en vivo de OpenAI/core, modelos en vivo de Docker para OpenAI, núcleo de Gateway nativo, perfil de Gateway nativo de OpenAI, Plugin nativo de OpenAI y Gateway en vivo de Docker para OpenAI.                     |
| `stable`  | Perfil predeterminado de aprobación de versión. | `minimum` más smoke de Anthropic, Google, MiniMax, backend, arnés nativo de pruebas en vivo, backend de CLI en vivo de Docker, enlace ACP de Docker, arnés Codex de Docker y un shard smoke de OpenCode Go. |
| `full`    | Barrido consultivo amplio.             | `stable` más proveedores consultivos, shards en vivo de Plugin y shards en vivo de medios.                                                                                                        |

## Adiciones solo de full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo de full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos en vivo de Docker               | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                          |
| Gateway en vivo de Docker              | Proveedores consultivos divididos en shards DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                              |
| Perfiles de proveedor de Gateway nativo | Shards completos de Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelos OpenCode Go, OpenRouter, xAI y Z.ai. |
| Shards nativos de Plugin en vivo        | Plugins A-K, L-N, otros O-Z, Moonshot y xAI.                                                                             |
| Shards nativos de medios en vivo         | Audio, música de Google, música de MiniMax y grupos de video A-D.                                                                   |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa en su lugar los shards más amplios
de modelos Anthropic y OpenCode Go. Las reejecuciones enfocadas aún pueden usar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Reejecuciones enfocadas

Usa `rerun_group` para evitar repetir cajas de versión no relacionadas:

| Identificador       | Alcance                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Todas las etapas de Full Release Validation.                                                     |
| `ci`                | Solo el subflujo manual de CI completa.                                                          |
| `plugin-prerelease` | Solo el subflujo de Plugin Prerelease.                                                           |
| `release-checks`    | Todas las etapas de OpenClaw Release Checks.                                                     |
| `install-smoke`     | Install Smoke mediante comprobaciones de lanzamiento.                                            |
| `cross-os`          | Comprobaciones de lanzamiento Cross-OS.                                                          |
| `live-e2e`          | Validación de E2E de repo/en vivo y ruta de lanzamiento de Docker.                               |
| `package`           | Package Acceptance.                                                                              |
| `qa`                | Paridad de QA más carriles de QA en vivo.                                                        |
| `qa-parity`         | Solo carriles e informe de paridad de QA.                                                        |
| `qa-live`           | Solo Matrix y Telegram de QA en vivo.                                                            |
| `npm-telegram`      | E2E de Telegram con paquete publicado; requiere `release_package_spec` o `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando haya fallado una suite en vivo.
Los ids de filtro válidos se definen en el flujo de trabajo reutilizable de en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador de reejecución agregado para sus
tres fragmentos de proveedor, por lo que aún se expande a todos los trabajos de advisory Docker gateway.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` cuando haya fallado un carril Cross-OS.
El filtro acepta un id de SO, un id de suite o un par SO/suite, por
ejemplo `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes Cross-OS
incluyen tiempos por fase para carriles de actualización empaquetada, y los comandos de larga duración
imprimen líneas de Heartbeat para que una actualización de Windows atascada sea visible antes del
tiempo de espera del trabajo.

Los carriles de comprobación de lanzamiento de QA son advisory. Un fallo solo de QA se informa como advertencia
y no bloquea el verificador de comprobaciones de lanzamiento; vuelve a ejecutar `rerun_group=qa`,
`qa-parity` o `qa-live` cuando necesites evidencia nueva de QA.

## Evidencia que conservar

Conserva el resumen de `Full Release Validation` como índice de nivel de lanzamiento. Enlaza
ids de ejecuciones secundarias e incluye tablas de trabajos más lentos. Para fallos, inspecciona primero el
flujo de trabajo secundario y luego vuelve a ejecutar el identificador más pequeño correspondiente de los anteriores.

Artefactos útiles:

- `release-package-under-test` del padre Full Release Validation y `OpenClaw Release Checks`
- Artefactos de ruta de lanzamiento de Docker en `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance y artefactos de aceptación de Docker
- Artefactos de comprobación de lanzamiento Cross-OS para cada SO y suite
- Artefactos de paridad de QA, Matrix y Telegram

## Archivos de flujo de trabajo

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
