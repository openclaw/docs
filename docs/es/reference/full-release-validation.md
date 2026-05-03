---
read_when:
    - Ejecutar o volver a ejecutar la validación completa de lanzamiento
    - Comparación de perfiles de validación de versiones estables y completas
    - Depuración de fallos en etapas de validación de lanzamientos
summary: Etapas de validación completa de la versión, flujos de trabajo secundarios, perfiles de versión, identificadores de reejecución y evidencia
title: Validación completa del lanzamiento
x-i18n:
    generated_at: "2026-05-03T21:37:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de la versión. Es el único punto de
entrada manual para la prueba previa al lanzamiento, pero la mayor parte del
trabajo ocurre en flujos de trabajo secundarios para que una caja fallida pueda
volver a ejecutarse sin reiniciar toda la versión.

Ejecútalo desde una referencia de flujo de trabajo confiable, normalmente `main`, y pasa la rama de versión,
la etiqueta o el SHA de commit completo como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Los flujos de trabajo secundarios usan la referencia de flujo de trabajo confiable para el arnés y el valor de entrada
`ref` para el candidato bajo prueba. Eso mantiene disponible la nueva lógica de validación
al validar una rama de versión o etiqueta más antigua.

Package Acceptance normalmente compila el tarball candidato desde el
`ref` resuelto, incluidas las ejecuciones con SHA completo despachadas con `pnpm ci:full-release`. Después de
publicar, pasa `package_acceptance_package_spec=openclaw@YYYY.M.D` (o
`openclaw@beta`/`openclaw@latest`) para ejecutar la misma matriz de paquete/actualización contra
el paquete npm publicado en su lugar.

## Etapas de nivel superior

| Etapa                | Detalles                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del objetivo | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de versión, la etiqueta o el SHA de commit completo y registra las entradas seleccionadas.<br />**Reejecución:** vuelve a ejecutar el paraguas si esto falla.                                                                                                                                                                              |
| Vitest y CI normal | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** grafo manual de CI completo contra la referencia objetivo, incluidas las vías de Linux Node, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, humo de compilación, comprobaciones de documentación, Skills de Python, Windows, macOS, i18n de Control UI y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`. |
| Prelanzamiento de plugins | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de plugins solo de versión, cobertura agéntica de plugins, fragmentos completos de lotes de extensiones y vías Docker de prelanzamiento de plugins.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Comprobaciones de versión | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** humo de instalación, comprobaciones de paquetes entre sistemas operativos, suites live/E2E, fragmentos de ruta de versión Docker, Package Acceptance, paridad de QA Lab, Matrix live y Telegram live.<br />**Reejecución:** `rerun_group=release-checks` o un identificador de release-checks más específico.                                |
| Artefacto de paquete | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** crea el tarball padre `release-package-under-test` lo suficientemente pronto para las comprobaciones orientadas a paquetes que no necesitan esperar a `OpenClaw Release Checks`.<br />**Reejecución:** vuelve a ejecutar el paraguas o proporciona `npm_telegram_package_spec` para `rerun_group=npm-telegram`.                                   |
| Paquete Telegram     | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** prueba del paquete Telegram respaldada por el artefacto padre para `rerun_group=all` con `release_profile=full`, o prueba de Telegram con paquete publicado cuando se establece `npm_telegram_package_spec`.<br />**Reejecución:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`.                              |
| Verificador del paraguas | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y agrega tablas de los trabajos más lentos de los flujos de trabajo secundarios.<br />**Reejecución:** vuelve a ejecutar solo este trabajo después de volver a ejecutar un secundario fallido hasta que pase.                                                                                                                                   |

Para `ref=main` y `rerun_group=all`, un paraguas más nuevo sustituye a uno más antiguo.
Cuando se cancela el padre, su monitor cancela cualquier flujo de trabajo secundario que ya haya
despachado. Las ejecuciones de validación de ramas de versión y etiquetas no se cancelan entre sí de forma
predeterminada.

## Etapas de comprobaciones de versión

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el objetivo
una vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas orientadas a paquetes
o a Docker lo necesitan.

| Etapa               | Detalles                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de versión | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro de suite live enfocado.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefacto de paquete | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y sube `release-package-under-test` para comprobaciones posteriores orientadas a paquetes.<br />**Reejecución:** el grupo de paquete, entre sistemas operativos o live/E2E afectado.                                                                                                           |
| Humo de instalación | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo de respaldo:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de imagen de humo del Dockerfile raíz, instalación del paquete QR, humos Docker de raíz y Gateway, pruebas Docker del instalador, humo de proveedor de imágenes con instalación global Bun y E2E rápido de instalación/desinstalación de plugins incluidos.<br />**Reejecución:** `rerun_group=install-smoke`.                              |
| Entre sistemas operativos | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo de respaldo:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** vías nuevas y de actualización en Linux, Windows y macOS para el proveedor y modo seleccionados, usando el tarball candidato más un paquete base.<br />**Reejecución:** `rerun_group=cross-os`.                                                                               |
| E2E de repositorio y live | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E de repositorio, caché live, streaming websocket de OpenAI, proveedor live nativo y fragmentos de plugins, y arneses live respaldados por Docker de modelo/backend/Gateway seleccionados por `release_profile`.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de versión Docker | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** fragmentos Docker de ruta de versión contra el artefacto de paquete compartido.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo de respaldo:** `Package Acceptance`<br />**Pruebas:** fixtures de paquetes de plugins offline, actualización de plugins, aceptación de paquete Telegram con OpenAI simulado y comprobaciones de supervivencia de actualización publicada desde cada versión estable de npm en o después de `2026.4.23` contra el mismo tarball.<br />**Reejecución:** `rerun_group=package`.                                         |
| Paridad de QA       | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo de respaldo:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica de candidato y base, luego el informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                       |
| Matrix live de QA   | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** perfil de QA Matrix live rápido en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live de QA | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** QA de Telegram live con arrendamientos de credenciales de Convex CI.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                    |
| Verificador de versión | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** trabajos requeridos de comprobación de versión para el grupo de reejecución seleccionado.<br />**Reejecución:** vuelve a ejecutar después de que pasen los trabajos secundarios enfocados.                                                                                                                                                                                                 |

## Fragmentos de ruta de versión Docker

La etapa de ruta de versión Docker ejecuta estos fragmentos cuando `live_suite_filter` está
vacío:

| Fragmento                                                       | Cobertura                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Vías de humo de ruta de versión Docker del núcleo.                      |
| `package-update-openai`                                         | Instalación de paquete OpenAI y comportamiento de actualización.        |
| `package-update-anthropic`                                      | Instalación de paquete Anthropic y comportamiento de actualización.     |
| `package-update-core`                                           | Comportamiento de paquete y actualización neutral respecto al proveedor. |
| `plugins-runtime-plugins`                                       | Vías de runtime de plugins que ejercitan el comportamiento de plugins.  |
| `plugins-runtime-services`                                      | Vías de runtime de plugins respaldados por servicios; incluye OpenWebUI cuando se solicita. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalación/runtime de plugins divididos para validación de versión en paralelo. |

Usa `docker_lanes=<lane[,lane]>` dirigido en el workflow reutilizable live/E2E cuando
solo haya fallado un carril de Docker. Los artefactos de release incluyen comandos
de reejecución por carril con entradas para reutilizar artefactos de paquete e
imágenes cuando estén disponibles.

## Perfiles de release

`release_profile` controla principalmente la amplitud live/proveedor dentro de las comprobaciones de release.
No elimina la CI completa normal, Plugin Prerelease, install smoke, package
acceptance, QA Lab ni los bloques de ruta de release de Docker. `full` también hace que la
ejecución general lance el E2E de Telegram de paquete contra el artefacto de paquete de release principal cuando
`rerun_group=all`, de modo que un candidato completo previo a la publicación no omita silenciosamente ese
carril de paquete de Telegram.

| Perfil    | Uso previsto                         | Cobertura live/proveedor incluida                                                                                                                                                    |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Smoke crítico de release más rápido. | Ruta live de OpenAI/core, modelos live de Docker para OpenAI, núcleo de Gateway nativo, perfil de Gateway nativo de OpenAI, Plugin nativo de OpenAI y Gateway live de Docker OpenAI. |
| `stable`  | Perfil predeterminado de aprobación de release. | `minimum` más smoke de Anthropic, Google, MiniMax, backend, arnés de pruebas live nativo, backend de CLI live de Docker, bind de ACP de Docker, arnés Codex de Docker y un shard de smoke de OpenCode Go. |
| `full`    | Barrido consultivo amplio.           | `stable` más proveedores consultivos, shards live de Plugin y shards live de medios.                                                                                                  |

## Adiciones solo de full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo de full                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos live de Docker           | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                             |
| Gateway live de Docker           | Proveedores consultivos divididos en shards de DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                       |
| Perfiles de proveedor de Gateway nativo | Shards completos de Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelos OpenCode Go, OpenRouter, xAI y Z.ai. |
| Shards live de Plugin nativos    | Plugins A-K, L-N, O-Z otros, Moonshot y xAI.                                                                                |
| Shards live de medios nativos    | Audio, música de Google, música de MiniMax y grupos de video A-D.                                                           |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa en su lugar los shards de modelos
más amplios de Anthropic y OpenCode Go. Las reejecuciones enfocadas aún pueden usar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Reejecuciones enfocadas

Usa `rerun_group` para evitar repetir cajas de release no relacionadas:

| Identificador        | Alcance                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `all`                | Todas las etapas de Full Release Validation.                          |
| `ci`                 | Solo hijo de CI completa manual.                                      |
| `plugin-prerelease`  | Solo hijo de Plugin Prerelease.                                       |
| `release-checks`     | Todas las etapas de OpenClaw Release Checks.                          |
| `install-smoke`      | Install Smoke mediante comprobaciones de release.                     |
| `cross-os`           | Comprobaciones de release Cross-OS.                                   |
| `live-e2e`           | Validación E2E repo/live y de ruta de release de Docker.              |
| `package`            | Package Acceptance.                                                   |
| `qa`                 | Paridad de QA más carriles live de QA.                                |
| `qa-parity`          | Solo carriles de paridad de QA e informe.                             |
| `qa-live`            | Solo Matrix live de QA y Telegram.                                    |
| `npm-telegram`       | E2E de Telegram de paquete publicado; requiere `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando haya fallado una suite live.
Los id de filtro válidos se definen en el workflow reutilizable live/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador de reejecución agregado para sus
tres shards de proveedor, por lo que aún se despliega a todos los trabajos consultivos de Gateway de Docker.

## Evidencia que conservar

Conserva el resumen de `Full Release Validation` como índice de nivel de release. Enlaza
ids de ejecuciones hijas e incluye tablas de trabajos más lentos. En caso de fallos, inspecciona primero el
workflow hijo y luego reejecuta el identificador coincidente más pequeño de arriba.

Artefactos útiles:

- `release-package-under-test` de Full Release Validation principal y `OpenClaw Release Checks`
- Artefactos de ruta de release de Docker en `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance y artefactos de aceptación de Docker
- Artefactos de comprobación de release Cross-OS para cada SO y suite
- Artefactos de paridad de QA, Matrix y Telegram

## Archivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
