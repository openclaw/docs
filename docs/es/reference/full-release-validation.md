---
read_when:
    - Ejecución o repetición de la Validación completa de la versión
    - Comparación de los perfiles de validación de versiones estable y completa
    - Depuración de fallos en las etapas de validación de lanzamiento
summary: Etapas de validación de la versión completa, flujos de trabajo secundarios, perfiles de lanzamiento, identificadores de repetición de ejecución y evidencia
title: Validación completa de la versión
x-i18n:
    generated_at: "2026-07-05T11:43:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5ece97d1f12e6a097cf9314acd47614f0f80cee704b1b48c0cedfe5e39ff064
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` es el paraguas de la versión: el único punto de entrada manual
para la prueba previa al lanzamiento. La mayor parte del trabajo ocurre en flujos de trabajo secundarios para que una máquina fallida pueda
volver a ejecutarse sin reiniciar toda la versión.

Ejecútalo desde una referencia de flujo de trabajo de confianza, normalmente `main`, y pasa la rama de versión,
la etiqueta o el SHA completo de commit como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` también acepta `anthropic` o `minimax` para la incorporación multiplataforma y el
turno de agente de extremo a extremo. Los flujos de trabajo secundarios usan la referencia de flujo de trabajo de confianza para el
arnés y el `ref` de entrada para el candidato bajo prueba, por lo que la nueva lógica de validación
sigue disponible al validar una rama o etiqueta de versión anterior.

`release_profile=stable` y `release_profile=full` siempre ejecutan la prueba prolongada
live/Docker exhaustiva. Pasa `run_release_soak=true` para incluir los mismos carriles de prueba prolongada
con el perfil `beta`. La publicación estable rechaza un manifiesto de validación
sin esta prueba prolongada y sin evidencia bloqueante de rendimiento del producto.

Package Acceptance normalmente compila el tarball candidato desde el `ref`
resuelto, incluidas las ejecuciones con SHA completo despachadas con `pnpm ci:full-release`. Después de una
publicación beta, pasa `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para reutilizar
el paquete npm publicado en las comprobaciones de versión, Package Acceptance, multiplataforma,
Docker de ruta de versión y Telegram de paquete. Usa `package_acceptance_package_spec`
solo cuando Package Acceptance deba demostrar intencionadamente un paquete diferente.
El carril de paquete live del plugin Codex sigue el mismo estado: los valores
`release_package_spec` publicados derivan `codex_plugin_spec=npm:@openclaw/codex@<version>`;
las ejecuciones con SHA/artefacto empaquetan `extensions/codex` desde el ref seleccionado; y los operadores
pueden establecer `codex_plugin_spec` directamente para fuentes de plugin `npm:`, `npm-pack:` o `git:`.
El carril concede la aprobación explícita de instalación de Codex CLI requerida por
ese plugin, luego ejecuta la comprobación previa de Codex CLI y turnos de agente de OpenAI en la misma sesión.

## Etapas de nivel superior

Para `rerun_group=all`, un trabajo `Verify Docker runtime image assets` bloquea todas las
demás etapas: compila el objetivo Docker `runtime-assets` con
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex` antes de que se despache cualquier otra cosa. Un
`rerun_group` más limitado omite esta comprobación previa.

| Etapa                   | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Resolución del objetivo       | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** resuelve la rama de versión, la etiqueta o el SHA completo de commit y registra las entradas seleccionadas.<br />**Reejecución:** vuelve a ejecutar el paraguas si esto falla.                                                                                                                                                                                                                                             |
| Comprobación previa de recursos Docker | **Trabajo:** `Verify Docker runtime image assets`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** el objetivo de compilación Docker `runtime-assets` todavía se completa correctamente antes de que se despache cualquier otra etapa. Se ejecuta solo para `rerun_group=all`.<br />**Reejecución:** vuelve a ejecutar el paraguas con `rerun_group=all`.                                                                                                                                                                          |
| Vitest y CI normal    | **Trabajo:** `Run normal full CI`<br />**Flujo de trabajo secundario:** `CI`<br />**Demuestra:** grafo de CI completo manual contra el ref objetivo, incluidos carriles de Linux Node, fragmentos de plugins incluidos, fragmentos de contrato de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones de humo de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, i18n de Control UI y Android mediante el paraguas.<br />**Reejecución:** `rerun_group=ci`.                           |
| Prelanzamiento de plugins       | **Trabajo:** `Run plugin prerelease validation`<br />**Flujo de trabajo secundario:** `Plugin Prerelease`<br />**Demuestra:** comprobaciones estáticas de plugins exclusivas de versión, cobertura agéntica de plugins, fragmentos completos por lotes de plugins, carriles Docker de prelanzamiento de plugins y un artefacto no bloqueante `plugin-inspector-advisory` para triaje de compatibilidad.<br />**Reejecución:** `rerun_group=plugin-prerelease`.                                                                                           |
| Comprobaciones de versión          | **Trabajo:** `Run release/live/Docker/QA validation`<br />**Flujo de trabajo secundario:** `OpenClaw Release Checks`<br />**Demuestra:** humo de instalación, comprobaciones de paquete multiplataforma, Package Acceptance, paridad de QA Lab, Matrix live y Telegram live. Los perfiles estable y completo también ejecutan suites live/E2E exhaustivas y fragmentos Docker de ruta de versión; beta puede optar por incluirlos con `run_release_soak=true`.<br />**Reejecución:** `rerun_group=release-checks` o un identificador de release-checks más limitado. |
| Telegram de paquete        | **Trabajo:** `Run package Telegram E2E`<br />**Flujo de trabajo secundario:** `NPM Telegram Beta E2E`<br />**Demuestra:** un E2E enfocado de Telegram con paquete publicado cuando `release_package_spec` o `npm_telegram_package_spec` está establecido. La validación completa del candidato usa en su lugar el E2E canónico de Telegram de Package Acceptance.<br />**Reejecución:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                                               |
| Rendimiento del producto     | **Trabajo:** `Run product performance evidence`<br />**Flujo de trabajo secundario:** `OpenClaw Performance`<br />**Demuestra:** ejecución de rendimiento de perfil de versión (`profile=release`, `repeat=3`, `fail_on_regression=true`) contra el SHA objetivo. Requerido (bloqueante) solo para `rerun_group=all` o `rerun_group=performance`; no requerido para grupos de reejecución más limitados.<br />**Reejecución:** `rerun_group=performance`.                                                              |
| Verificador del paraguas       | **Trabajo:** `Verify full validation`<br />**Flujo de trabajo secundario:** ninguno<br />**Demuestra:** vuelve a comprobar las conclusiones registradas de las ejecuciones secundarias y añade tablas de trabajos más lentos desde los flujos de trabajo secundarios.<br />**Reejecución:** vuelve a ejecutar solo este trabajo después de volver a ejecutar un flujo secundario fallido hasta que pase.                                                                                                                                                                                                  |

Para `ref=main` y `rerun_group=all`, un paraguas más nuevo sustituye a uno anterior.
Cuando se cancela el padre, su monitor cancela cualquier flujo de trabajo secundario que ya haya
despachado. Las ejecuciones de validación de ramas de versión y etiquetas no se cancelan entre sí de
forma predeterminada.

## Etapas de comprobaciones de versión

`OpenClaw Release Checks` es el flujo de trabajo secundario más grande. Resuelve el objetivo
una vez y prepara un artefacto compartido `release-package-under-test` cuando las etapas orientadas a paquetes
o Docker lo necesitan.

| Etapa                    | Detalles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetivo de versión      | **Trabajo:** `Resolve target ref`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** referencia seleccionada, SHA esperado opcional, perfil, grupo de reejecución y filtro enfocado de suite en vivo.<br />**Reejecución:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                          |
| Artefacto de paquete     | **Trabajo:** `Prepare release package artifact`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** empaqueta o resuelve un tarball candidato y sube `release-package-under-test` para comprobaciones posteriores orientadas a paquetes.<br />**Reejecución:** el grupo de paquete afectado, cross-OS o en vivo/E2E.                                                                                                                                                                                                                                                |
| Smoke de instalación     | **Trabajo:** `Run install smoke`<br />**Flujo de trabajo de respaldo:** `Install Smoke`<br />**Pruebas:** ruta de instalación completa con reutilización de imagen smoke del Dockerfile raíz, instalación de paquete QR, smokes de Docker raíz y Gateway, pruebas de Docker del instalador y smoke de proveedor de imágenes con instalación global de Bun.<br />**Reejecución:** `rerun_group=install-smoke`.                                                                                                                                                                      |
| Cross-OS                 | **Trabajo:** `cross_os_release_checks`<br />**Flujo de trabajo de respaldo:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Pruebas:** carriles nuevos y de actualización en Linux, Windows y macOS para el proveedor y modo seleccionados, usando el tarball candidato más un paquete de referencia.<br />**Reejecución:** `rerun_group=cross-os`.                                                                                                                                                                                                                         |
| Repositorio y E2E en vivo | **Trabajo:** `Run repo/live E2E validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** E2E de repositorio, caché en vivo, streaming websocket de OpenAI, shards de proveedor en vivo nativo y Plugin, y arneses de modelo/backend/Gateway en vivo respaldados por Docker seleccionados por `release_profile`.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` enfocado.<br />**Reejecución:** `rerun_group=live-e2e`, opcionalmente con `live_suite_filter`. |
| Ruta de versión Docker   | **Trabajo:** `Run Docker release-path validation`<br />**Flujo de trabajo de respaldo:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Pruebas:** fragmentos de Docker de ruta de versión contra el artefacto de paquete compartido.<br />**Ejecuciones:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` enfocado.<br />**Reejecución:** `rerun_group=live-e2e`.                                                                                                                                                                                |
| Aceptación de paquetes   | **Trabajo:** `Run package acceptance`<br />**Flujo de trabajo de respaldo:** `Package Acceptance`<br />**Pruebas:** fixtures de paquete Plugin sin conexión, actualización de Plugin, el E2E canónico del paquete mock-OpenAI Telegram y comprobaciones de supervivencia de actualización publicada contra el mismo tarball. Las comprobaciones de versión bloqueantes usan la referencia publicada más reciente predeterminada; las comprobaciones soak (`run_release_soak=true`) se amplían a las últimas 4 versiones estables de npm más 3 versiones históricas fijadas (`2026.4.23`, `2026.5.2`, `2026.4.15`), ejecutadas contra fixtures de actualización de incidencias reportadas.<br />**Reejecución:** `rerun_group=package`. |
| Tarjeta de puntuación de madurez | **Trabajo:** `Render maturity scorecard release docs`<br />**Flujo de trabajo de respaldo:** `maturity-scorecard.yml`<br />**Pruebas:** renderiza la documentación de la tarjeta de puntuación de madurez consultiva contra la referencia objetivo. Solo se ejecuta cuando se pasa `run_maturity_scorecard=true`.<br />**Reejecución:** `rerun_group=qa` con `run_maturity_scorecard=true`.                                                                                                                                                                               |
| Paridad de QA            | **Trabajo:** `Run QA Lab parity lane` y `Run QA Lab parity report`<br />**Flujo de trabajo de respaldo:** trabajos directos<br />**Pruebas:** paquetes de paridad agéntica candidata y de referencia, y luego el informe de paridad.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                                                             |
| Paridad de runtime de QA | **Trabajo:** `Run QA Lab runtime parity lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** un carril de paridad agéntica de par de runtimes `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), incluido un nivel estándar y, con `run_release_soak=true`, un nivel soak. Consultivo: los fallos individuales no bloquean el verificador de comprobaciones de versión.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                      |
| Cobertura de herramientas del runtime de QA | **Trabajo:** `Enforce QA Lab runtime tool coverage`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** deriva dinámica de herramientas entre `openclaw` y `codex` en el nivel estándar de paridad de runtime (`pnpm openclaw qa coverage --tools`), usando la salida del carril de paridad de runtime de QA. Bloqueante: este trabajo no se puede anular como consultivo.<br />**Reejecución:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                     |
| Matrix en vivo de QA     | **Trabajo:** `Run QA Lab live Matrix lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** perfil rápido de QA de Matrix en vivo en el entorno `qa-live-shared`.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                           |
| Telegram en vivo de QA   | **Trabajo:** `Run QA Lab live Telegram lane`<br />**Flujo de trabajo de respaldo:** trabajo directo<br />**Pruebas:** QA de Telegram en vivo con arrendamientos de credenciales de Convex CI.<br />**Reejecución:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                       |
| Verificador de versión   | **Trabajo:** `Verify release checks`<br />**Flujo de trabajo de respaldo:** ninguno<br />**Pruebas:** trabajos requeridos de comprobación de versión para el grupo de reejecución seleccionado.<br />**Reejecución:** reejecutar después de que pasen los trabajos secundarios enfocados.                                                                                                                                                                                                                                                                                         |

## Fragmentos de ruta de versión Docker

La etapa de ruta de versión Docker ejecuta estos fragmentos cuando `live_suite_filter` está
vacío:

| Fragmento                                                       | Cobertura                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Carriles smoke de ruta de versión Docker del núcleo.                                                                        |
| `package-update-openai`                                         | Comportamiento de instalación/actualización de paquete OpenAI, instalación bajo demanda de Codex, turnos en vivo del Plugin Codex y llamadas a herramientas de Chat Completions. |
| `package-update-anthropic`                                      | Comportamiento de instalación y actualización de paquete Anthropic.                                                         |
| `package-update-core`                                           | Comportamiento de paquete y actualización neutral respecto al proveedor.                                                    |
| `plugins-runtime-plugins`                                       | Carriles de runtime de Plugin que ejercitan el comportamiento de Plugin.                                                    |
| `plugins-runtime-services`                                      | Carriles de runtime de Plugin respaldados por servicios y en vivo; incluye OpenWebUI cuando se solicita.                    |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lotes de instalación/runtime de Plugin divididos para validación de versión en paralelo.                                    |

Usa `docker_lanes=<lane[,lane]>` dirigido en el flujo de trabajo reutilizable en vivo/E2E cuando
solo falló un carril Docker. Los artefactos de versión incluyen comandos de reejecución
por carril con entradas de artefacto de paquete y reutilización de imagen cuando están disponibles.

## Perfiles de versión

`release_profile` controla principalmente la amplitud en vivo/de proveedores dentro de las comprobaciones de lanzamiento.
No elimina la CI completa normal, Plugin Prerelease, la prueba de instalación, la
aceptación de paquetes ni QA Lab. Los perfiles estable y completo siempre ejecutan cobertura exhaustiva de E2E de repositorio/en vivo
y de soak de ruta de lanzamiento de Docker. El perfil beta puede optar por incluirla con
`run_release_soak=true`. Package Acceptance proporciona el E2E de Telegram de paquete canónico
para cada candidato completo, por lo que el paraguas no duplica ese
sondeador en vivo.

| Perfil   | Uso previsto                     | Cobertura en vivo/de proveedores incluida                                                                                                                                                                  |
| -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Prueba crítica de lanzamiento más rápida. | Ruta en vivo de OpenAI/núcleo, modelos en vivo de Docker para OpenAI, núcleo de gateway nativo, perfil de Gateway de OpenAI nativo, Plugin de OpenAI nativo y Gateway OpenAI en vivo de Docker.            |
| `stable` | Perfil predeterminado de aprobación de lanzamiento. | `beta` más prueba de Anthropic, Google, MiniMax, backend, arnés de pruebas en vivo nativo, backend de CLI en vivo de Docker, enlace ACP de Docker, arnés Codex de Docker, subagent-announce de Docker y un shard de prueba de OpenCode Go. |
| `full`   | Barrido consultivo amplio.       | `stable` más proveedores consultivos, shards en vivo de Plugin y shards en vivo de medios.                                                                                                                 |

## Adiciones solo de full

Estas suites se omiten en `stable` y se incluyen en `full`:

| Área                             | Cobertura solo de full                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelos en vivo de Docker        | OpenCode Go, OpenRouter, xAI, Z.ai y Fireworks.                                                                             |
| Gateway en vivo de Docker        | Proveedores consultivos divididos en shards de DeepSeek/Fireworks, OpenCode Go/OpenRouter y xAI/Z.ai.                       |
| Perfiles de proveedor de Gateway nativo | Shards completos de Anthropic Opus y Sonnet/Haiku, Fireworks, DeepSeek, shards completos de modelos de OpenCode Go, OpenRouter, xAI y Z.ai. |
| Shards en vivo de Plugin nativo  | Plugins A-K, L-N, O-Z otros, Moonshot y xAI.                                                                                |
| Shards en vivo de medios nativos | Audio, música de Google, música de MiniMax y grupos de video A-D.                                                           |

`stable` incluye `native-live-src-gateway-profiles-anthropic-smoke` y
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa en su lugar los shards más amplios
de modelos de Anthropic y OpenCode Go. Las repeticiones enfocadas aún pueden usar los
identificadores agregados `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Repeticiones enfocadas

Usa `rerun_group` para evitar repetir cajas de lanzamiento no relacionadas:

| Identificador       | Alcance                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `all`               | Todas las etapas de Full Release Validation.                                                   |
| `ci`                | Solo el hijo de CI completa manual.                                                           |
| `plugin-prerelease` | Solo el hijo de Plugin Prerelease.                                                            |
| `release-checks`    | Todas las etapas de OpenClaw Release Checks.                                                   |
| `install-smoke`     | Install Smoke mediante comprobaciones de lanzamiento.                                         |
| `cross-os`          | Comprobaciones de lanzamiento multiplataforma.                                                 |
| `live-e2e`          | Validación de E2E de repositorio/en vivo y ruta de lanzamiento de Docker.                      |
| `package`           | Package Acceptance.                                                                           |
| `qa`                | Paridad de QA más carriles en vivo de QA.                                                      |
| `qa-parity`         | Solo carriles e informe de paridad de QA.                                                      |
| `qa-live`           | Matrix/Telegram en vivo de QA más carriles de Discord, WhatsApp y Slack controlados cuando estén habilitados. |
| `npm-telegram`      | E2E de Telegram de paquete publicado; requiere `release_package_spec` o `npm_telegram_package_spec`. |
| `performance`       | Solo evidencia de rendimiento del producto.                                                    |

Usa `live_suite_filter` con `rerun_group=live-e2e` cuando haya fallado una suite en vivo.
Los ids de filtro válidos se definen en el workflow reutilizable en vivo/E2E, incluidos
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` y
`live-codex-harness-docker`.

El identificador `live-gateway-advisory-docker` es un identificador agregado de repetición para sus
tres shards de proveedores, por lo que aún se expande a todos los trabajos consultivos de Gateway de Docker.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` cuando haya fallado un carril multiplataforma.
El filtro acepta un id de SO, un id de suite o un par SO/suite, por
ejemplo `windows/packaged-upgrade`, `windows` o `packaged-fresh`. Los resúmenes
multiplataforma incluyen tiempos por fase para carriles de actualización empaquetada, y los comandos
de larga duración imprimen líneas de Heartbeat para que una actualización atascada sea visible antes del
tiempo de espera del trabajo.

Los fallos de comprobación de lanzamiento de QA bloquean la validación normal de lanzamiento. La comprobación de
cobertura de herramientas de runtime de QA (deriva dinámica de herramientas entre `openclaw` y `codex` en el
nivel estándar) también bloquea el verificador de comprobaciones de lanzamiento, aunque el
carril subyacente de paridad de runtime de QA sea consultivo. Las ejecuciones alfa de Tideclaw aún pueden
tratar como consultivos los carriles de comprobación de lanzamiento que no sean de seguridad de paquete. Cuando
`live_suite_filter` solicita explícitamente un carril en vivo de QA controlado como Discord,
WhatsApp o Slack, la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
correspondiente debe estar habilitada; de lo contrario, la captura de entrada falla en lugar de omitir silenciosamente el carril.
Vuelve a ejecutar `rerun_group=qa`, `qa-parity` o `qa-live` cuando
necesites evidencia de QA actualizada.

## Evidencia que conservar

Conserva el resumen de `Full Release Validation` como índice de nivel de lanzamiento. Enlaza
ids de ejecuciones hijas e incluye tablas de trabajos más lentos. Para fallos, inspecciona primero el
workflow hijo y luego vuelve a ejecutar el identificador coincidente más pequeño de arriba.

Artefactos útiles:

- `release-package-under-test` de `OpenClaw Release Checks`
- Artefactos de ruta de lanzamiento de Docker en `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance y artefactos de aceptación de Docker
- Artefactos de comprobación de lanzamiento multiplataforma para cada SO y suite
- Artefactos de paridad de QA, paridad de runtime, Matrix y Telegram

## Archivos de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
