---
read_when:
    - Ejecutar o volver a ejecutar la validación completa de lanzamiento
    - Comparación de los perfiles de validación de lanzamiento estable y completo
    - Depuración de fallos en la etapa de validación de la versión
summary: Etapas de Validación completa de lanzamiento, flujos de trabajo secundarios, perfiles de lanzamiento, identificadores de reejecución y evidencia
title: Validación completa del lanzamiento
x-i18n:
    generated_at: "2026-05-02T05:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de la versión. Es el único punto de entrada manual
para la prueba previa a la versión, pero la mayor parte del trabajo ocurre en flujos de trabajo secundarios para que una
caja fallida pueda volver a ejecutarse sin reiniciar toda la versión.

Ejecútalo desde una referencia de flujo de trabajo confiable, normalmente `main`, y pasa la rama de versión,
la etiqueta o el SHA completo de commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Los flujos de trabajo secundarios usan la referencia de flujo de trabajo confiable para el arnés y la entrada
`ref` para el candidato bajo prueba. Eso mantiene disponible la nueva lógica de validación
al validar una rama o etiqueta de versión anterior.

## Etapas de nivel superior

| Etapa                | Detalles                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del objetivo    | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de versión, la etiqueta o el SHA completo de commit, y registra las entradas seleccionadas.<br />**Volver a ejecutar:** vuelve a ejecutar el paraguas si esto falla.                                                                                                                                                                              |
| Vitest y CI normal | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** grafo de CI completo manual contra la referencia objetivo, incluidas las lanes de Node en Linux, shards de Plugin incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, i18n de Control UI y Android mediante el paraguas.<br />**Volver a ejecutar:** `rerun_group=ci`. |
| Preversión de Plugin    | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de Plugin solo de versión, cobertura agentic de Plugin, shards de lotes completos de extensiones y lanes de Docker de preversión de Plugin.<br />**Volver a ejecutar:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Comprobaciones de versión       | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** smoke de instalación, comprobaciones de paquetes entre sistemas operativos, suites live/E2E, fragmentos de ruta de versión de Docker, Package Acceptance, paridad de QA Lab, Matrix live y Telegram live.<br />**Volver a ejecutar:** `rerun_group=release-checks` o un identificador de release-checks más limitado.                                |
| Paquete de Telegram     | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** prueba de paquete Telegram respaldada por artefactos para `rerun_group=all` con `release_profile=full`, o prueba de Telegram de paquete publicado cuando `npm_telegram_package_spec` está definido.<br />**Volver a ejecutar:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`.                                     |
| Verificador paraguas    | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de ejecuciones secundarias y añade tablas de trabajos más lentos desde los flujos de trabajo secundarios.<br />**Volver a ejecutar:** vuelve a ejecutar solo este trabajo después de volver a ejecutar correctamente un secundario fallido.                                                                                                                                   |

Para `ref=main` y `rerun_group=all`, un paraguas más nuevo reemplaza a uno anterior.
Cuando se cancela el padre, su monitor cancela cualquier flujo de trabajo secundario que ya haya
despachado. Las ejecuciones de validación de ramas y etiquetas de versión no se cancelan entre sí de forma
predeterminada.

## Etapas de comprobaciones de versión

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el objetivo
una vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas orientadas a paquetes
o Docker lo necesitan.

| Etapa               | Detalles                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de versión      | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Prueba:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro de suite live enfocada.<br />**Volver a ejecutar:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefacto de paquete    | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Prueba:** empaqueta o resuelve un tarball candidato y carga `release-package-under-test` para comprobaciones posteriores orientadas a paquetes.<br />**Volver a ejecutar:** el grupo de paquete, entre sistemas operativos o live/E2E afectado.                                                                                                           |
| Smoke de instalación       | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo de respaldo:** `Install Smoke`<br />**Prueba:** ruta de instalación completa con reutilización de imagen smoke de Dockerfile raíz, instalación de paquete QR, smokes de Docker raíz y de Gateway, pruebas de Docker del instalador, smoke de proveedor de imagen con instalación global de Bun y E2E rápido de instalación/desinstalación de Plugin incluido.<br />**Volver a ejecutar:** `rerun_group=install-smoke`.                              |
| Entre sistemas operativos            | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo de respaldo:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Prueba:** lanes nuevas y de actualización en Linux, Windows y macOS para el proveedor y modo seleccionados, usando el tarball candidato más un paquete de referencia.<br />**Volver a ejecutar:** `rerun_group=cross-os`.                                                                               |
| Repo y E2E live   | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Prueba:** E2E de repositorio, caché live, streaming de websocket de OpenAI, shards de proveedor live nativo y Plugin, y arneses live respaldados por Docker de modelo/backend/Gateway seleccionados por `release_profile`.<br />**Volver a ejecutar:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de versión de Docker | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Prueba:** fragmentos de Docker de ruta de versión contra el artefacto de paquete compartido.<br />**Volver a ejecutar:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo de respaldo:** `Package Acceptance`<br />**Prueba:** fixtures de paquete de Plugin offline, actualización de Plugin y aceptación de paquete Telegram con OpenAI simulado contra el mismo tarball.<br />**Volver a ejecutar:** `rerun_group=package`.                                                                                                                                  |
| Paridad de QA           | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo de respaldo:** trabajos directos<br />**Prueba:** paquetes de paridad agentic del candidato y de referencia, luego el informe de paridad.<br />**Volver a ejecutar:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                       |
| Matrix live de QA      | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Prueba:** perfil rápido de QA de Matrix live en el entorno `qa-live-shared`.<br />**Volver a ejecutar:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live de QA    | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Prueba:** QA de Telegram live con leases de credenciales de Convex CI.<br />**Volver a ejecutar:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                    |
| Verificador de versión    | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Prueba:** trabajos de comprobación de versión requeridos para el grupo de reejecución seleccionado.<br />**Volver a ejecutar:** vuelve a ejecutar después de que pasen los trabajos secundarios enfocados.                                                                                                                                                                                                 |

## Fragmentos de ruta de versión de Docker

La etapa de ruta de versión de Docker ejecuta estos fragmentos cuando `live_suite_filter` está
vacío:

| Fragmento                                                           | Cobertura                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lanes smoke de ruta de versión de Docker principales.                                   |
| `package-update-openai`                                         | Comportamiento de instalación y actualización de paquete de OpenAI.                             |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización de paquete de Anthropic.                          |
| `package-update-core`                                           | Comportamiento de paquete y actualización neutral respecto al proveedor.                           |
| `plugins-runtime-plugins`                                       | Lanes de runtime de Plugin que ejercitan comportamiento de Plugin.                     |
| `plugins-runtime-services`                                      | Lanes de runtime de Plugin respaldadas por servicios; incluye OpenWebUI cuando se solicita. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalación/runtime de Plugin divididos para validación de versión en paralelo.   |

Usa `docker_lanes=<lane[,lane]>` dirigido en el flujo de trabajo live/E2E reutilizable cuando
solo haya fallado una lane de Docker. Los artefactos de versión incluyen comandos de reejecución por lane
con artefacto de paquete y entradas de reutilización de imagen cuando están disponibles.

## Perfiles de versión

`release_profile` controla principalmente la amplitud live/proveedor dentro de las comprobaciones de versión.
No elimina CI completo normal, Plugin Prerelease, smoke de instalación, aceptación de paquete,
QA Lab ni fragmentos de ruta de versión de Docker. `full` también hace que el
paraguas ejecute E2E de paquete Telegram contra el artefacto de paquete de versión cuando
`rerun_group=all`, de modo que un candidato completo previo a la publicación no omita silenciosamente esa
lane de paquete Telegram.

| Perfil    | Uso previsto                         | Cobertura en vivo/proveedor incluida                                                                                                                                                       |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke más rápido crítico para release. | Ruta en vivo de OpenAI/core, modelos en vivo de Docker para OpenAI, núcleo del Gateway nativo, perfil de Gateway OpenAI nativo, Plugin OpenAI nativo y Gateway OpenAI en vivo de Docker.    |
| `stable`  | Perfil predeterminado de aprobación de release. | `minimum` más Anthropic, Google, MiniMax, backend, arnés de pruebas en vivo nativo, backend de CLI en vivo de Docker, enlace ACP de Docker, arnés Codex de Docker y un shard de smoke de OpenCode Go. |
| `full`    | Barrido amplio de asesoría.          | `stable` más proveedores de asesoría, shards en vivo de plugins y shards en vivo de medios.                                                                                                |

## Adiciones solo de full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo de full                                                         |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modelos en vivo de Docker        | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                |
| Gateway en vivo de Docker        | Shard de asesoría para DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI y Z.ai. |
| Perfiles de proveedor de Gateway nativo | Fireworks, DeepSeek, shards completos de modelo OpenCode Go, OpenRouter, xAI y Z.ai. |
| Shards en vivo de Plugin nativo  | Plugins A-K, L-N, O-Z otros, Moonshot y xAI.                                   |
| Shards en vivo de medios nativos | Audio, música de Google, música de MiniMax y grupos de video A-D.              |

`stable` incluye `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa en su lugar los shards más amplios de modelo OpenCode Go.

## Reejecuciones enfocadas

Usa `rerun_group` para evitar repetir cajas de release no relacionadas:

| Identificador       | Alcance                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `all`               | Todas las etapas de Full Release Validation.                         |
| `ci`                | Solo hijo manual de CI completo.                                     |
| `plugin-prerelease` | Solo hijo de prerelease de Plugin.                                   |
| `release-checks`    | Todas las etapas de OpenClaw Release Checks.                         |
| `install-smoke`     | Install Smoke hasta las comprobaciones de release.                   |
| `cross-os`          | Comprobaciones de release Cross-OS.                                  |
| `live-e2e`          | Validación de E2E del repo/en vivo y de la ruta de release de Docker. |
| `package`           | Package Acceptance.                                                  |
| `qa`                | Paridad de QA más carriles de QA en vivo.                            |
| `qa-parity`         | Solo carriles e informe de paridad de QA.                            |
| `qa-live`           | Solo Matrix y Telegram en vivo de QA.                                |
| `npm-telegram`      | E2E de Telegram con paquete publicado; requiere `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando falle una suite en vivo.
Los ids de filtro válidos se definen en el flujo de trabajo reutilizable live/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

## Evidencia que conservar

Conserva el resumen de `Full Release Validation` como índice de nivel de release. Enlaza
los ids de ejecuciones hijas e incluye tablas de trabajos más lentos. Para fallos, inspecciona primero el flujo de trabajo hijo y luego reejecuta el identificador coincidente más pequeño de arriba.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de ruta de release de Docker bajo `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance y artefactos de aceptación de Docker
- Artefactos de comprobación de release Cross-OS para cada SO y suite
- Artefactos de paridad de QA, Matrix y Telegram

## Archivos de flujo de trabajo

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
