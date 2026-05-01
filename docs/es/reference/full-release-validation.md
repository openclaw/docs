---
read_when:
    - Ejecutar o volver a ejecutar la validación completa del lanzamiento
    - Comparación de los perfiles de validación de versiones estable y completo
    - Depuración de fallos en la etapa de validación de lanzamiento
summary: Etapas de validación completa del lanzamiento, flujos de trabajo secundarios, perfiles de lanzamiento, identificadores de reejecución y evidencia
title: Validación completa del lanzamiento
x-i18n:
    generated_at: "2026-05-01T05:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de la versión. Es el único punto de entrada manual
para la prueba previa a la versión, pero la mayor parte del trabajo ocurre en flujos de trabajo secundarios para que una
caja fallida pueda volver a ejecutarse sin reiniciar toda la versión.

Ejecútalo desde una referencia de flujo de trabajo de confianza, normalmente `main`, y pasa la rama de versión,
etiqueta o SHA de commit completo como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Los flujos de trabajo secundarios usan la referencia de flujo de trabajo de confianza para el arnés y la entrada
`ref` para el candidato bajo prueba. Eso mantiene disponible la nueva lógica de validación
al validar una rama o etiqueta de versión anterior.

## Etapas de nivel superior

| Etapa                 | Detalles                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolución del destino     | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Prueba:** resuelve la rama de versión, etiqueta o SHA de commit completo y registra las entradas seleccionadas.<br />**Reejecución:** vuelve a ejecutar el paraguas si esto falla.                                                                                                                                                                              |
| Vitest y CI normal  | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Prueba:** grafo de CI completo manual contra la referencia de destino, incluidas vías de Linux Node, fragmentos de Plugin incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de docs, Skills de Python, Windows, macOS, i18n de la interfaz de control y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`. |
| Prelanzamiento de Plugin     | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Prueba:** comprobaciones estáticas de Plugin solo para versión, cobertura de Plugin agéntica, fragmentos completos de lotes de extensiones y vías de Docker de prelanzamiento de Plugin.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Comprobaciones de versión        | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Prueba:** smoke de instalación, comprobaciones de paquetes entre sistemas operativos, suites live/E2E, segmentos de ruta de versión de Docker, Package Acceptance, paridad de QA Lab, Matrix live y Telegram live.<br />**Reejecución:** `rerun_group=release-checks` o un identificador de release-checks más estrecho.                                |
| Telegram posterior a la publicación | **Trabajo:** `Run post-publish Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Prueba:** prueba opcional de Telegram con paquete publicado cuando `npm_telegram_package_spec` está definido.<br />**Reejecución:** `rerun_group=npm-telegram`.                                                                                                                                                     |
| Verificador del paraguas     | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Prueba:** vuelve a comprobar las conclusiones registradas de ejecuciones secundarias y agrega tablas de trabajos más lentos de los flujos de trabajo secundarios.<br />**Reejecución:** vuelve a ejecutar solo este trabajo después de volver a ejecutar un secundario fallido hasta que quede verde.                                                                                                                                   |

Para `ref=main` y `rerun_group=all`, un paraguas más nuevo reemplaza a uno anterior.
Cuando se cancela el padre, su monitor cancela cualquier flujo de trabajo secundario que ya haya
despachado. Las ejecuciones de validación de ramas y etiquetas de versión no se cancelan entre sí de forma
predeterminada.

## Etapas de comprobaciones de versión

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el destino
una vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas orientadas a paquetes
o Docker lo necesitan.

| Etapa               | Detalles                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Destino de versión      | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Prueba:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro de suite live enfocado.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefacto de paquete    | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Prueba:** empaqueta o resuelve un tarball candidato y sube `release-package-under-test` para comprobaciones descendentes orientadas a paquetes.<br />**Reejecución:** el grupo afectado de paquete, entre sistemas operativos o live/E2E.                                                                                                           |
| Smoke de instalación       | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo de respaldo:** `Install Smoke`<br />**Prueba:** ruta de instalación completa con reutilización de imagen smoke de Dockerfile raíz, instalación de paquete QR, smokes de Docker raíz y Gateway, pruebas Docker del instalador, smoke de proveedor de imágenes con instalación global de Bun y E2E rápido de Docker de Plugin incluido.<br />**Reejecución:** `rerun_group=install-smoke`.                                         |
| Entre sistemas operativos            | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo de respaldo:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Prueba:** vías frescas y de actualización en Linux, Windows y macOS para el proveedor y modo seleccionados, usando el tarball candidato más un paquete de referencia.<br />**Reejecución:** `rerun_group=cross-os`.                                                                               |
| Repo y E2E live   | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Prueba:** E2E del repositorio, caché live, streaming de websocket de OpenAI, proveedor live nativo y fragmentos de Plugin, y arneses live respaldados por Docker de modelo/backend/Gateway seleccionados por `release_profile`.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de versión de Docker | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Prueba:** segmentos Docker de ruta de versión contra el artefacto de paquete compartido.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo de respaldo:** `Package Acceptance`<br />**Prueba:** compatibilidad de dependencias de canales incluidos nativa del artefacto, fixtures de paquetes de Plugin sin conexión y aceptación de paquete de Telegram con OpenAI simulado contra el mismo tarball.<br />**Reejecución:** `rerun_group=package`.                                                                                       |
| Paridad de QA           | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo de respaldo:** trabajos directos<br />**Prueba:** paquetes de paridad agéntica de candidato y referencia, luego el informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                       |
| Matrix live de QA      | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Prueba:** perfil de QA de Matrix live rápido en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live de QA    | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Prueba:** QA live de Telegram con arrendamientos de credenciales de Convex CI.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                    |
| Verificador de versión    | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Prueba:** trabajos de comprobación de versión requeridos para el grupo de reejecución seleccionado.<br />**Reejecución:** vuelve a ejecutar después de que pasen los trabajos secundarios enfocados.                                                                                                                                                                                                 |

## Segmentos de ruta de versión de Docker

La etapa de ruta de versión de Docker ejecuta estos segmentos cuando `live_suite_filter` está
vacío:

| Segmento                                                                                       | Cobertura                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Vías smoke de ruta de versión de Docker del núcleo.                                   |
| `package-update-openai`                                                                     | Comportamiento de instalación y actualización de paquete de OpenAI.                             |
| `package-update-anthropic`                                                                  | Comportamiento de instalación y actualización de paquete de Anthropic.                          |
| `package-update-core`                                                                       | Comportamiento de paquete y actualización neutral respecto al proveedor.                           |
| `plugins-runtime-plugins`                                                                   | Vías de runtime de Plugin que ejercitan el comportamiento de Plugin.                     |
| `plugins-runtime-services`                                                                  | Vías de runtime de Plugin respaldadas por servicios; incluye OpenWebUI cuando se solicita. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | Lotes de instalación/runtime de Plugin divididos para validación de versión en paralelo.   |
| `bundled-channels-core`                                                                     | Comportamiento de Docker de canales incluidos.                                        |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Comportamiento de actualización de canales incluidos.                                        |
| `bundled-channels-contracts`                                                                | Comprobaciones de contrato de canales incluidos en la ruta de versión de Docker.             |

Usa `docker_lanes=<lane[,lane]>` dirigido en el flujo de trabajo reutilizable live/E2E cuando
solo haya fallado una vía Docker. Los artefactos de la versión incluyen comandos
de reejecución por vía con entradas para reutilizar artefactos de paquete e imágenes
cuando están disponibles.

## Perfiles de versión

`release_profile` solo controla la amplitud live/proveedor dentro de las comprobaciones de versión. No
elimina el CI completo normal, Plugin Prerelease, el smoke de instalación, la aceptación de paquete,
QA Lab ni los fragmentos de ruta de versión de Docker.

| Perfil    | Uso previsto                         | Cobertura live/proveedor incluida                                                                                                                                              |
| --------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke crítico de versión más rápido. | Ruta live OpenAI/core, modelos live Docker para OpenAI, núcleo de gateway nativo, perfil Gateway nativo OpenAI, Plugin nativo OpenAI y Gateway live Docker OpenAI.            |
| `stable`  | Perfil predeterminado de aprobación de versión. | `minimum` más Anthropic, Google, MiniMax, backend, arnés de pruebas live nativo, backend CLI live Docker, enlace ACP Docker, arnés Codex Docker y un shard smoke OpenCode Go. |
| `full`    | Barrido consultivo amplio.           | `stable` más proveedores consultivos, shards live de plugins y shards live multimedia.                                                                                         |

## Adiciones solo de full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo de full                                                           |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Modelos live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                  |
| Gateway live Docker              | Shard consultivo para DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI y Z.ai. |
| Perfiles de proveedor de Gateway nativo | Fireworks, DeepSeek, shards completos de modelos OpenCode Go, OpenRouter, xAI y Z.ai. |
| Shards live de Plugin nativo     | Plugins A-K, L-N, O-Z otros, Moonshot y xAI.                                     |
| Shards live multimedia nativos   | Audio, música de Google, música de MiniMax y grupos de video A-D.                |

`stable` incluye `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa en su lugar los shards más amplios de modelos OpenCode Go.

## Reejecuciones enfocadas

Usa `rerun_group` para evitar repetir cajas de versión no relacionadas:

| Identificador       | Alcance                                           |
| ------------------- | ------------------------------------------------- |
| `all`               | Todas las etapas de Full Release Validation.      |
| `ci`                | Solo hijo de CI completo manual.                  |
| `plugin-prerelease` | Solo hijo de Plugin Prerelease.                   |
| `release-checks`    | Todas las etapas de OpenClaw Release Checks.      |
| `install-smoke`     | Install Smoke hasta las comprobaciones de versión. |
| `cross-os`          | Comprobaciones de versión Cross-OS.               |
| `live-e2e`          | Validación repo/live E2E y ruta de versión Docker. |
| `package`           | Package Acceptance.                               |
| `qa`                | Paridad QA más vías live QA.                      |
| `qa-parity`         | Solo vías de paridad QA e informe.                |
| `qa-live`           | Solo Matrix live QA y Telegram.                   |
| `npm-telegram`      | Solo Telegram E2E opcional posterior a la publicación. |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando haya fallado una suite live.
Los id. de filtro válidos se definen en el flujo de trabajo reutilizable live/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

## Evidencia que conservar

Conserva el resumen `Full Release Validation` como índice a nivel de versión. Enlaza
los id. de ejecuciones hijas e incluye tablas de trabajos más lentos. En caso de fallos, inspecciona primero
el flujo de trabajo hijo y luego reejecuta el identificador coincidente más pequeño de arriba.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de ruta de versión Docker bajo `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance y artefactos de aceptación Docker
- Artefactos de comprobación de versión Cross-OS para cada sistema operativo y suite
- Artefactos de paridad QA, Matrix y Telegram

## Archivos de flujo de trabajo

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
