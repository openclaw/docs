---
read_when:
    - Ejecutar o volver a ejecutar la validación completa de la versión
    - Comparación de los perfiles de validación de lanzamiento estable y completo
    - Depuración de fallos en la etapa de validación de la versión
summary: Etapas de validación completa de lanzamiento, flujos de trabajo secundarios, perfiles de lanzamiento, identificadores de reejecución y evidencia
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-05-02T21:03:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de lanzamiento. Es el único punto de entrada
manual para la prueba previa al lanzamiento, pero la mayor parte del trabajo ocurre
en flujos de trabajo secundarios para que una caja fallida pueda reejecutarse sin
reiniciar todo el lanzamiento.

Ejecútalo desde una referencia de flujo de trabajo de confianza, normalmente `main`,
y pasa la rama de lanzamiento, etiqueta o SHA de commit completo como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Los flujos de trabajo secundarios usan la referencia de flujo de trabajo de confianza
para el arnés y la entrada `ref` para el candidato bajo prueba. Eso mantiene
disponible la nueva lógica de validación al validar una rama o etiqueta de
lanzamiento anterior.

Package Acceptance normalmente construye el tarball candidato desde el `ref`
resuelto, incluidas ejecuciones con SHA completo despachadas con `pnpm ci:full-release`.
Después de publicar, pasa `package_acceptance_package_spec=openclaw@YYYY.M.D` (o
`openclaw@beta`/`openclaw@latest`) para ejecutar la misma matriz de paquete/actualización
contra el paquete npm enviado en su lugar.

## Etapas de nivel superior

| Etapa                | Detalles                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del objetivo    | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de lanzamiento, etiqueta o SHA de commit completo y registra las entradas seleccionadas.<br />**Reejecución:** reejecuta el paraguas si esto falla.                                                                                                                                                                              |
| Vitest y CI normal | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** grafo de CI completo manual contra la referencia objetivo, incluidas lanes de Linux Node, shards de Plugin incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, i18n de Control UI y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`. |
| Prelanzamiento de Plugin    | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de Plugin solo de lanzamiento, cobertura agéntica de Plugin, shards completos por lotes de extensiones y lanes Docker de prelanzamiento de Plugin.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Comprobaciones de lanzamiento       | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** smoke de instalación, comprobaciones de paquetes entre sistemas operativos, suites live/E2E, fragmentos de ruta de lanzamiento Docker, Package Acceptance, paridad de QA Lab, Matrix live y Telegram live.<br />**Reejecución:** `rerun_group=release-checks` o un identificador de release-checks más estrecho.                                |
| Paquete Telegram     | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** prueba de paquete Telegram respaldada por artefacto para `rerun_group=all` con `release_profile=full`, o prueba de Telegram de paquete publicado cuando `npm_telegram_package_spec` está definido.<br />**Reejecución:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`.                                     |
| Verificador paraguas    | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de ejecuciones secundarias y agrega tablas de trabajos más lentos desde flujos de trabajo secundarios.<br />**Reejecución:** reejecuta solo este trabajo después de volver a ejecutar un secundario fallido hasta que quede verde.                                                                                                                                   |

Para `ref=main` y `rerun_group=all`, un paraguas más nuevo reemplaza a uno anterior.
Cuando se cancela el padre, su monitor cancela cualquier flujo de trabajo secundario
que ya haya despachado. Las ejecuciones de validación de ramas y etiquetas de
lanzamiento no se cancelan entre sí de forma predeterminada.

## Etapas de comprobaciones de lanzamiento

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el
objetivo una vez y prepara un artefacto compartido `release-package-under-test` cuando
lo necesitan las etapas orientadas a paquetes o Docker.

| Etapa               | Detalles                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de lanzamiento      | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro de suite live enfocado.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefacto de paquete    | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y sube `release-package-under-test` para comprobaciones posteriores orientadas a paquetes.<br />**Reejecución:** el grupo de paquete, cross-OS o live/E2E afectado.                                                                                                           |
| Smoke de instalación       | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo de respaldo:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de imagen smoke de Dockerfile raíz, instalación de paquete QR, smokes Docker raíz y de Gateway, pruebas Docker de instalador, smoke de proveedor de imagen con instalación global Bun y E2E rápido de instalación/desinstalación de Plugin incluido.<br />**Reejecución:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo de respaldo:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** lanes nuevas y de actualización en Linux, Windows y macOS para el proveedor y modo seleccionados, usando el tarball candidato más un paquete de referencia.<br />**Reejecución:** `rerun_group=cross-os`.                                                                               |
| E2E de repo y live   | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E de repositorio, caché live, streaming websocket de OpenAI, shards de proveedor live nativo y Plugin, y arneses live respaldados por Docker de modelo/backend/Gateway seleccionados por `release_profile`.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de lanzamiento Docker | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** fragmentos Docker de ruta de lanzamiento contra el artefacto de paquete compartido.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo de respaldo:** `Package Acceptance`<br />**Pruebas:** fixtures de paquete de Plugin sin conexión, actualización de Plugin, aceptación de paquete Telegram con OpenAI simulado y comprobaciones de supervivencia de actualización publicada desde cada lanzamiento npm estable en o después de `2026.4.23` contra el mismo tarball.<br />**Reejecución:** `rerun_group=package`.                                         |
| Paridad QA           | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo de respaldo:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica de candidato y baseline, luego el informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                       |
| Matrix live de QA      | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** perfil rápido de QA Matrix live en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live de QA    | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** QA live de Telegram con concesiones de credenciales de Convex CI.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                    |
| Verificador de lanzamiento    | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** trabajos de release-check requeridos para el grupo de reejecución seleccionado.<br />**Reejecución:** reejecuta después de que pasen los trabajos secundarios enfocados.                                                                                                                                                                                                 |

## Fragmentos de ruta de lanzamiento Docker

La etapa de ruta de lanzamiento Docker ejecuta estos fragmentos cuando `live_suite_filter` está
vacío:

| Fragmento                                                           | Cobertura                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lanes smoke de ruta de lanzamiento Docker del núcleo.                                   |
| `package-update-openai`                                         | Comportamiento de instalación y actualización de paquete OpenAI.                             |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización de paquete Anthropic.                          |
| `package-update-core`                                           | Comportamiento de paquete y actualización neutral respecto al proveedor.                           |
| `plugins-runtime-plugins`                                       | Lanes de runtime de Plugin que ejercitan el comportamiento de Plugin.                     |
| `plugins-runtime-services`                                      | Lanes de runtime de Plugin respaldadas por servicios; incluye OpenWebUI cuando se solicita. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalación/runtime de Plugin divididos para validación de lanzamiento en paralelo.   |

Usa `docker_lanes=<lane[,lane]>` dirigido en el flujo de trabajo reusable live/E2E cuando
solo haya fallado una lane Docker. Los artefactos de lanzamiento incluyen comandos
de reejecución por lane con artefacto de paquete y entradas de reutilización de imagen
cuando están disponibles.

## Perfiles de lanzamiento

`release_profile` controla principalmente la amplitud de live/proveedor dentro de las comprobaciones de lanzamiento.
No elimina la CI completa normal, Plugin Prerelease, la prueba de instalación, la
aceptación de paquetes, QA Lab ni los fragmentos de ruta de lanzamiento de Docker. `full` también hace que la
ejecución paraguas ejecute el E2E de Telegram del paquete contra el artefacto del paquete de lanzamiento cuando
`rerun_group=all`, de modo que un candidato completo previo a la publicación no omita silenciosamente ese
carril de paquete de Telegram.

| Perfil    | Uso previsto                         | Cobertura live/proveedor incluida                                                                                                                                              |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Prueba crítica de lanzamiento más rápida. | Ruta live de OpenAI/core, modelos live de Docker para OpenAI, núcleo de Gateway nativo, perfil de Gateway nativo de OpenAI, Plugin nativo de OpenAI y Gateway live de Docker para OpenAI. |
| `stable`  | Perfil predeterminado de aprobación de lanzamiento. | `minimum` más Anthropic, Google, MiniMax, backend, arnés de pruebas live nativo, backend CLI live de Docker, enlace ACP de Docker, arnés Codex de Docker y un fragmento de prueba de OpenCode Go. |
| `full`    | Barrido consultivo amplio.           | `stable` más proveedores consultivos, fragmentos live de Plugin y fragmentos live de medios.                                                                                   |

## Adiciones solo de full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo de full                                                          |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modelos live de Docker           | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                 |
| Gateway live de Docker           | Fragmento consultivo para DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI y Z.ai. |
| Perfiles de proveedor de Gateway nativo | Fireworks, DeepSeek, fragmentos completos de modelo OpenCode Go, OpenRouter, xAI y Z.ai. |
| Fragmentos live de Plugin nativo | Plugins A-K, L-N, otros O-Z, Moonshot y xAI.                                    |
| Fragmentos live de medios nativos | Audio, música de Google, música de MiniMax y grupos de video A-D.               |

`stable` incluye `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa en su lugar los fragmentos más amplios de modelo OpenCode Go.

## Reejecuciones enfocadas

Usa `rerun_group` para evitar repetir cajas de lanzamiento no relacionadas:

| Identificador       | Alcance                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Todas las etapas de Full Release Validation.                          |
| `ci`                | Solo el hijo de CI completa manual.                                   |
| `plugin-prerelease` | Solo el hijo de Plugin Prerelease.                                    |
| `release-checks`    | Todas las etapas de OpenClaw Release Checks.                          |
| `install-smoke`     | Prueba de instalación mediante comprobaciones de lanzamiento.         |
| `cross-os`          | Comprobaciones de lanzamiento entre sistemas operativos.              |
| `live-e2e`          | Validación E2E de repo/live y ruta de lanzamiento de Docker.          |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Paridad de QA más carriles live de QA.                                |
| `qa-parity`         | Solo carriles de paridad de QA e informe.                             |
| `qa-live`           | Solo Matrix y Telegram live de QA.                                    |
| `npm-telegram`      | E2E de Telegram de paquete publicado; requiere `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando haya fallado una suite live.
Los ids de filtro válidos se definen en el flujo de trabajo reutilizable live/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

## Evidencia que conservar

Conserva el resumen de `Full Release Validation` como índice de nivel de lanzamiento. Enlaza
los ids de ejecuciones hijas e incluye tablas de trabajos más lentos. Para fallos, inspecciona primero el flujo de trabajo
hijo y luego reejecuta el identificador coincidente más pequeño de arriba.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de ruta de lanzamiento de Docker bajo `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance y artefactos de aceptación de Docker
- Artefactos de comprobación de lanzamiento entre sistemas operativos para cada sistema operativo y suite
- Artefactos de paridad de QA, Matrix y Telegram

## Archivos de flujo de trabajo

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
