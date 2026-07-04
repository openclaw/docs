---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Añadir regresiones para errores de modelo/proveedor
    - Depuración del comportamiento del Gateway y del agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-07-04T03:35:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitarias/integración, e2e, en vivo) y un conjunto pequeño
de ejecutores Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (local, previo al push, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo añadir regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** se documenta por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) - arquitectura, superficie de comandos, autoría de escenarios.
- [QA de Matrix](/es/concepts/qa-matrix) - referencia para `pnpm openclaw qa matrix`.
- [Tarjeta de puntuación de madurez](/es/maturity/scorecard) - cómo la evidencia de QA de versiones respalda las decisiones de estabilidad y LTS.
- [Canal de QA](/es/channels/qa-channel) - el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de las suites de prueba regulares y los ejecutores Docker/Parallels. La sección de ejecutores específicos de QA a continuación ([Ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con bastante capacidad: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras más confianza:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

## Directorios temporales de prueba

Prefiere los helpers compartidos en `test/helpers/temp-dir.ts` para directorios
temporales propiedad de las pruebas. Hacen explícita la propiedad y mantienen la limpieza en el mismo
ciclo de vida de la prueba:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` intencionalmente no expone ningún método de limpieza manual; Vitest
se encarga de la limpieza después de cada prueba. Los helpers existentes de nivel inferior siguen disponibles para pruebas que
aún no se han migrado, pero las pruebas nuevas y migradas deben usar el rastreador
de limpieza automática. Evita nuevos usos manuales de `makeTempDir`, `cleanupTempDirs` o
`createTempDirTracker`, y evita nuevas llamadas directas a `fs.mkdtemp*` en pruebas
salvo que un caso esté verificando explícitamente el comportamiento bruto de directorios temporales. Añade un comentario
auditable de autorización con una razón concreta cuando una prueba necesite intencionalmente un directorio temporal
directo:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Para visibilidad de migración, `node scripts/report-test-temp-creations.mjs` informa
nuevas creaciones directas de directorios temporales y nuevos usos manuales de helpers compartidos en líneas
añadidas del diff, sin bloquear estilos de limpieza existentes. Su alcance de archivos intencionalmente
sigue la misma clasificación de rutas de prueba usada por `scripts/changed-lanes.mjs`
en vez de mantener una heurística separada de nombres de archivo de helpers de prueba, mientras omite
la propia implementación del helper compartido. `check:changed` ejecuta este informe para
rutas de prueba modificadas como una señal de CI solo de advertencia; los hallazgos son anotaciones de advertencia
de GitHub, no fallos.

Cuando depures proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondas de herramienta/imagen de Gateway): `pnpm test:live`
- Seleccionar un archivo en vivo de forma silenciosa: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en tiempo de ejecución: despacha `OpenClaw Performance` con
  `live_openai_candidate=true` para un turno real de agente `openai/gpt-5.5` o
  `deep_profile=true` para artefactos de CPU/heap/traza de Kova. Las ejecuciones programadas diarias
  publican artefactos de carriles de proveedor simulado, perfil profundo y GPT 5.5 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe de proveedor simulado también incluye números a nivel de código fuente de arranque de Gateway, memoria,
  presión de Plugin, bucle repetido de saludo con modelo falso e inicio de CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un pequeño turno de imagen.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` cuando aísles fallos de proveedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diario y
    `OpenClaw Release Checks` manual llaman al flujo de trabajo reutilizable en vivo/E2E con
    `include_live_suites: true`, lo que incluye jobs separados de matriz de modelos en vivo con Docker
    fragmentados por proveedor.
  - Para reejecuciones enfocadas en CI, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añade nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de versión.
- Smoke de chat vinculado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo Docker contra la ruta del servidor de aplicación de Codex, vincula un
    MD sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, luego verifica una respuesta simple y una ruta de adjunto de imagen
    mediante el vínculo nativo del Plugin en vez de ACP.
- Smoke del arnés de servidor de aplicación de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway mediante el arnés de servidor de aplicación de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y de forma predeterminada ejercita sondas de imagen,
    MCP de Cron, subagente y Guardian. Desactiva la sonda de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` cuando aísles otros fallos del
    servidor de aplicación de Codex. Para una comprobación enfocada de subagente, desactiva las otras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después de la sonda de subagente salvo que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté establecido.
- Smoke de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala el tarball empaquetado de OpenClaw en Docker, ejecuta el onboarding con clave de API de OpenAI
    y verifica que el Plugin de Codex más la dependencia `@openai/codex`
    se descargaron bajo demanda en la raíz administrada del proyecto npm.
- Smoke en vivo de dependencia de herramienta de Plugin: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un Plugin de fixture con una dependencia real `slugify`, lo instala mediante
    `npm-pack:`, verifica la dependencia bajo la raíz administrada del proyecto npm,
    luego pide a un modelo OpenAI en vivo que llame a la herramienta del Plugin y devuelva el
    slug oculto.
- Smoke de comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional de cinturón y tirantes para la superficie del comando de rescate de canal de mensajes.
    Ejercita `/crestodian status`, encola un cambio persistente de modelo,
    responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH`
    y verifica que el fallback difuso del planificador se traduce en una escritura tipada
    de configuración auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío, verifica el entrypoint moderno de onboard
    de Crestodian, aplica escrituras de configuración/modelo/agente/Plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración de Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informa Moonshot/K2.6 y que la
  transcripción del asistente almacena `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas a continuación.
</Tip>

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de prueba principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo
`QA-Lab - All Lanes` y la validación de versiones, no como un flujo de trabajo de PR independiente.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de QA de release-checks. Las comprobaciones de versión
estable/predeterminada mantienen el soak exhaustivo en vivo/Docker detrás de `run_release_soak=true`; el
perfil `full` fuerza el soak. `QA-Lab - All Lanes`
se ejecuta cada noche en `main` y desde despacho manual con el carril de paridad simulado, el carril
Matrix en vivo, el carril Telegram en vivo administrado por Convex y el carril Discord en vivo
administrado por Convex como jobs paralelos. QA programado y las comprobaciones de versión pasan Matrix
`--profile fast` explícitamente, mientras que la CLI de Matrix y la entrada manual del flujo de trabajo
siguen teniendo `all` como valor predeterminado; el despacho manual puede fragmentar `all` en jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release
Checks` ejecuta paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación de la versión,
usando `mock-openai/gpt-5.5` para las comprobaciones de transporte de versión, de modo que se mantengan
deterministas y eviten el inicio normal de proveedor-Plugin. Estos Gateways de transporte en vivo
desactivan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad
de QA.

Los fragmentos multimedia en vivo de versión completa usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos Docker de modelos/backends en vivo usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` construida una vez por commit seleccionado,
y luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en vez de reconstruirla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Escribe los artefactos de nivel superior `qa-evidence.json`, `qa-suite-summary.json` y
    `qa-suite-report.md` para el conjunto de escenarios seleccionado, incluidas
    selecciones de escenarios de flujo mixto, Vitest y Playwright.
  - Cuando lo despacha `pnpm openclaw qa run --qa-profile <profile>`, incrusta el
    scorecard del perfil de taxonomía seleccionado en el mismo `qa-evidence.json`.
    `smoke-ci` escribe evidencia reducida, lo que establece `evidenceMode: "slim"` y omite
    `execution` por entrada. `release` cubre el subconjunto curado de preparación para la versión;
    `all` selecciona todas las categorías de madurez activas y está pensado para despachos explícitos del flujo de trabajo
    Profile Evidence de QA cuando se necesita un artefacto de scorecard completo.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de
    Gateway aislados. `qa-channel` usa concurrencia 4 de forma predeterminada (limitada por el
    número de escenarios seleccionado). Usa `--concurrency <count>` para ajustar el número de
    workers, o `--concurrency 1` para el carril serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y mocks de protocolo sin reemplazar el carril
    `mock-openai` consciente de escenarios.
- `pnpm openclaw qa coverage --match <query>`
  - Busca en IDs de escenarios, títulos, superficies, IDs de cobertura, referencias de docs, referencias de código,
    Plugins y requisitos de proveedor, y luego imprime los objetivos de suite coincidentes.
  - Úsalo antes de una ejecución de QA Lab cuando conozcas el comportamiento tocado o la ruta de archivo,
    pero no el escenario más pequeño. Es solo orientativo; aun así elige prueba mock,
    live, Multipass, Matrix o de transporte según el comportamiento que se esté cambiando.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta la batería live del Plugin OpenAI Kitchen Sink mediante QA Lab. Instala
    el paquete externo Kitchen Sink, verifica el inventario de superficie del SDK de Plugins,
    sondea `/healthz` y `/readyz`, registra evidencia de CPU/RSS del Gateway,
    ejecuta un turno live de OpenAI y comprueba diagnósticos adversariales.
    Requiere autenticación live de OpenAI, como `OPENAI_API_KEY`. En sesiones de Testbox
    hidratadas, carga automáticamente el perfil de autenticación live de Testbox cuando el helper
    `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de arranque del Gateway más un pequeño paquete de escenarios mock de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    bajo `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones sostenidas de CPU alta de forma predeterminada (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), por lo que las ráfagas breves de arranque se registran como métricas
    sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos compilados de `dist`; ejecuta primero una compilación cuando el checkout no
    tenga ya salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas flags de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor live de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante
    el workspace montado.
  - Escribe el informe y resumen normales de QA más los logs de Multipass bajo
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construye un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que el runtime del Plugin empaquetado cargue sin reparación de
    dependencias de arranque, ejecuta doctor y ejecuta un turno de agente local contra un
    endpoint OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar el mismo carril de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de app compilada en Docker para transcripciones de contexto de runtime
    incrustadas. Verifica que el contexto oculto de runtime de OpenClaw se persista como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario,
    luego siembra una sesión JSONL rota afectada y verifica que
    `openclaw doctor --fix` la reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete OpenClaw en Docker, ejecuta onboarding del paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza el carril live de QA de Telegram
    con ese paquete instalado como Gateway SUT.
  - El wrapper monta solo el código fuente del harness `qa-lab` desde el checkout; el
    paquete instalado es dueño de `dist`, `openclaw/plugin-sdk` y el runtime de Plugins
    empaquetados, por lo que el carril no mezcla Plugins del checkout actual en el paquete
    bajo prueba.
  - El valor predeterminado es `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; establece
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar en su lugar un tarball local resuelto en vez de
    instalar desde el registro.
  - Emite temporización RTT repetida en `qa-evidence.json` de forma predeterminada con
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescribe
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la ejecución RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` acepta una lista separada por comas de
    IDs de comprobación de QA de Telegram para muestrear; cuando no se establece, la comprobación
    predeterminada compatible con RTT es `telegram-mentioned-message-reply`.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/versiones, establece
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - El wrapper valida el env de credenciales de Telegram o Convex en el host antes del
    trabajo de build/install de Docker. Establece `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo cuando depures deliberadamente la configuración previa a credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para este carril. Cuando se seleccionan credenciales de Convex
    y no se establece ningún rol, el wrapper usa `ci` en CI y
    `maintainer` fuera de CI.
  - GitHub Actions expone este carril como el flujo de trabajo manual de mantenedor
    `NPM Telegram Beta E2E`. No se ejecuta en merge. El flujo de trabajo usa el entorno
    `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto en ejecución lateral
  contra un paquete candidato. Acepta una ref confiable, una especificación npm publicada,
  URL HTTPS de tarball más SHA-256, o artefacto tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test` y luego ejecuta el
  programador Docker E2E existente con perfiles de carril smoke, package, product, full o custom.
  Establece `telegram_mode=mock-openai` o `live-frontier` para ejecutar el flujo de trabajo de QA
  de Telegram contra el mismo artefacto `package-under-test`.
  - Prueba de producto de la beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba con URL exacta de tarball requiere un digest y usa la política de seguridad de URL pública:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Los espejos de tarball empresariales/privados usan una política explícita de fuente confiable:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lee `.github/package-trusted-sources.json` desde la ref confiable del flujo de trabajo y no acepta credenciales de URL ni una omisión de red privada mediante input de flujo de trabajo. Si la política nombrada declara autenticación bearer, configura el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prueba de artefacto descarga un artefacto tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita Plugins/canales empaquetados mediante ediciones de configuración.
  - Verifica que la detección de setup deje ausentes los Plugins descargables no configurados,
    que la primera reparación configurada de doctor instale explícitamente cada Plugin descargable
    faltante y que un segundo reinicio no ejecute reparación oculta de dependencias.
  - También instala una línea base npm antigua conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>` y verifica que el doctor posterior a la actualización del candidato
    limpie restos de dependencias de Plugins heredados sin una reparación postinstall del lado del
    harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados de Parallels. Cada
    plataforma seleccionada instala primero el paquete base solicitado, luego ejecuta el comando
    `openclaw update` instalado en el mismo invitado y verifica la versión instalada,
    el estado de actualización, la preparación del gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por carril.
  - El carril de OpenAI usa `openai/gpt-5.5` para la prueba live de turno de agente de forma
    predeterminada. Pasa `--model <provider/model>` o establece
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
  - Envuelve las ejecuciones locales largas en un timeout del host para que los bloqueos de transporte de Parallels no
    consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe logs de carril anidados bajo `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede pasar de 10 a 15 minutos en doctor posterior a la actualización y trabajo de
    actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el log de depuración
    npm anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con carriles smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en la
    restauración de snapshots, el servicio de paquetes o el estado del gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de Plugins empaquetados porque
    fachadas de capacidad como habla, generación de imágenes y comprensión de medios
    se cargan mediante APIs de runtime empaquetadas incluso cuando el turno de agente
    solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor proveedor AIMock local para pruebas smoke
    directas de protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de código fuente - las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y disposición de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real usando los tokens del bot controlador y del bot SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas. Usa el modo de entorno de forma predeterminada, o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por arrendamientos agrupados.
  - Los valores predeterminados cubren canary, control de menciones, direccionamiento de comandos, `/status`, respuestas mencionadas de bot a bot y respuestas de comandos nativos centrales. Los valores predeterminados de `mock-openai` también cubren regresiones deterministas de cadena de respuestas y streaming de mensaje final de Telegram. Usa `--list-scenarios` para sondeos opcionales como `session_status`.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita el modo Bot-to-Bot Communication Mode en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y `qa-evidence.json` bajo `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen RTT desde la solicitud de envío del controlador hasta la respuesta observada del SUT.

`Mantis Telegram Live` es el envoltorio de evidencia de PR alrededor de este carril. Ejecuta la
ref candidata con credenciales de Telegram arrendadas por Convex, renderiza el
paquete de informe/evidencia de QA redactado en un navegador de escritorio Crabbox, graba evidencia MP4,
genera un GIF recortado por movimiento, sube el paquete de artefactos y publica evidencia
en línea en el PR mediante Mantis GitHub App cuando `pr_number` está definido. Los responsables de mantenimiento pueden
iniciarlo desde la interfaz de Actions mediante `Mantis Scenario` (`scenario_id:
telegram-live`) o directamente desde un comentario en una pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` es el envoltorio agéntico nativo de Telegram Desktop
de antes/después para prueba visual de PR. Inícialo desde la interfaz de Actions con
`instructions` de formato libre, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), o desde un comentario en el PR:

```text
@openclaw-mantis telegram desktop proof
```

El agente Mantis lee el PR, decide qué comportamiento visible en Telegram demuestra el
cambio, ejecuta el carril de prueba de Telegram Desktop con usuario real en Crabbox sobre refs base y
candidatas, itera hasta que los GIF nativos sean útiles, escribe un manifiesto
`motionPreview` emparejado y publica la misma tabla de GIF de 2 columnas mediante
Mantis GitHub App cuando `pr_number` está definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Arrienda o reutiliza un escritorio Linux de Crabbox, instala Telegram Desktop nativo, configura OpenClaw con un token arrendado de bot SUT de Telegram, inicia el gateway y graba evidencia de captura de pantalla/MP4 desde el escritorio VNC visible.
  - Usa `--credential-source convex` de forma predeterminada, por lo que los flujos de trabajo solo necesitan el secreto del broker de Convex. Usa `--credential-source env` con las mismas variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop todavía necesita un inicio de sesión/perfil de usuario. El token del bot configura solo OpenClaw. Usa `--telegram-profile-archive-env <name>` para un archivo de perfil `.tgz` en base64, o usa `--keep-lease` e inicia sesión manualmente mediante VNC una vez.
  - Escribe `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4` bajo el directorio de salida.

Los carriles de transporte en vivo comparten un contrato estándar para que los transportes nuevos no diverjan; la matriz de cobertura por carril vive en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
QA de transporte en vivo, el laboratorio de QA adquiere un arrendamiento exclusivo desde un pool respaldado por Convex, envía Heartbeat para ese
arrendamiento mientras el carril se está ejecutando y libera el arrendamiento al apagar. El nombre de la sección es anterior al
soporte de Discord, Slack y WhatsApp; el contrato de arrendamiento se comparte entre tipos.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` de forma predeterminada en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos de administración para responsables de mantenimiento (agregar/quitar/listar en el pool) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para responsables de mantenimiento:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del broker,
el prefijo de endpoint, el tiempo de espera HTTP y la accesibilidad admin/list sin imprimir
valores secretos. Usa `--json` para salida legible por máquinas en scripts y utilidades de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Correcto: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintentable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Correcto: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Correcto: `{ status: "ok" }` (o `2xx` vacío)
- `POST /release`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Correcto: `{ status: "ok" }` (o `2xx` vacío)
- `POST /admin/add` (solo secreto de responsable de mantenimiento)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Correcto: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de responsable de mantenimiento)
  - Solicitud: `{ credentialId, actorId }`
  - Correcto: `{ status: "ok", changed, credential }`
  - Protección de arrendamiento activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de responsable de mantenimiento)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Correcto: `{ status: "ok", credentials, count }`

Forma de payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

Forma de payload para el tipo usuario real de Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` está reservado para el flujo de trabajo de prueba de Telegram Desktop de Mantis. Los carriles genéricos de QA Lab no deben adquirirlo.

Payloads multicanal validados por el broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Los carriles de Slack también pueden arrendar desde el pool, pero la validación de payload de Slack actualmente
vive en el ejecutor de QA de Slack en lugar del broker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para filas de Slack.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenarios para nuevos adaptadores de canal viven en [Resumen de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el ejecutor de transporte en la interfaz de host compartida `qa-lab`, declarar `qaRunners` en el manifiesto del plugin, montarlo como `openclaw qa <runner>` y crear escenarios bajo `qa/scenarios/`.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como "realismo creciente" (y mayor inestabilidad/costo):

### Unidad / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para la programación paralela
- Archivos: inventarios de núcleo/unidad bajo `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación de gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
  - Las pruebas del resolver y del cargador de superficie pública deben probar el comportamiento de fallback amplio de `api.js` y
    `runtime-api.js` con fixtures de plugin mínimos generados, no con
    APIs de código fuente de plugins reales incluidos. Las cargas reales de API de plugin pertenecen a
    suites de contrato/integración propiedad del plugin.

Política de dependencias nativas:

- Las instalaciones de prueba predeterminadas omiten las compilaciones nativas opcionales de opus para Discord. La voz de Discord usa `libopus-wasm` incluido, y `@discordjs/opus` permanece deshabilitado en `allowBuilds` para que las pruebas locales y los carriles de Testbox no compilen el addon nativo.
- Compara el rendimiento de opus nativo en el repo de benchmark de `libopus-wasm`, no en los bucles predeterminados de instalación/prueba de OpenClaw. No establezcas `@discordjs/opus` en `true` en el `allowBuilds` predeterminado; eso hace que bucles de instalación/prueba no relacionados compilen código nativo.

<AccordionGroup>
  <Accordion title="Proyectos, shards y carriles con alcance">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigante del proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo nativo de proyectos raíz de `vitest.config.ts`, porque un bucle de observación de varios fragmentos no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por carriles con alcance, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste completo de arranque del proyecto raíz.
    - `pnpm test:changed` expande por defecto las rutas de git modificadas en carriles con alcance baratos: ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y dependientes locales del grafo de imports. Las ediciones de configuración/setup/paquetes no ejecutan pruebas amplias salvo que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta de comprobación local inteligente normal para trabajo acotado. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensiones, apps, docs, metadatos de release, herramientas live de Docker y tooling, y después ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para prueba de tests. Los incrementos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/config/dependencias raíz, con una guardia que rechaza cambios de paquete fuera del campo de versión de nivel superior.
    - Las ediciones del arnés ACP live de Docker ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts live de autenticación de Docker y una ejecución de prueba del planificador live de Docker. Los cambios en `package.json` solo se incluyen cuando el diff se limita a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exports, versión y otras superficies de paquete siguen usando las guardias más amplias.
    - Las pruebas unitarias ligeras de imports de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` y áreas de utilidades puras similares se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados de runtime permanecen en los carriles existentes.
    - Los archivos fuente de helpers seleccionados de `plugin-sdk` y `commands` también asignan ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de helpers evitan volver a ejecutar la suite pesada completa de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers de core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol de reply en fragmentos de agent-runner, dispatch y commands/state-routing para que un bucket pesado de imports no sea dueño de toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de extensiones y el fragmento `agentic-plugins` exclusivo de release. Full Release Validation despacha el flujo de trabajo hijo separado `Plugin Prerelease` para esas suites pesadas de plugins/extensiones en candidatos de release.

  </Accordion>

  <Accordion title="Cobertura del runner integrado">

    - Cuando cambies entradas de descubrimiento de herramientas de mensaje o contexto de runtime de Compaction,
      conserva ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para límites puros de enrutamiento y normalización.
    - Mantén saludables las suites de integración del runner integrado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` y
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de Compaction sigan fluyendo
      por las rutas reales de `run.ts` / `compact.ts`; las pruebas solo de helpers
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados de pool y aislamiento de Vitest">

    - La configuración base de Vitest usa `threads` por defecto.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - El carril de UI raíz conserva su setup y optimizador de `jsdom`, pero también se ejecuta en el
      runner compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` para procesos Node hijos de Vitest
      por defecto para reducir la churn de compilación de V8 durante ejecuciones locales grandes.
      Configura `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento V8 estándar.
    - `scripts/run-vitest.mjs` termina las ejecuciones explícitas de Vitest sin watch después de
      5 minutos sin salida stdout ni stderr. Configura
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desactivar el supervisor en una
      investigación intencionadamente silenciosa.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de pre-commit solo formatea. Vuelve a preparar los archivos formateados y
      no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes de una entrega o push cuando
      necesites la puerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta por carriles con alcance baratos por defecto. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de arnés, configuración, paquete o contrato realmente necesita una
      cobertura Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
      solo con un límite superior de workers.
    - El escalado automático de workers locales es intencionadamente conservador y retrocede
      cuando el promedio de carga del host ya es alto, de modo que varias ejecuciones
      concurrentes de Vitest hacen menos daño por defecto.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las nuevas ejecuciones en modo changed sigan siendo correctas cuando cambie el
      cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` activado en hosts compatibles;
      configura `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación explícita de caché para perfilado directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` activa los informes de duración de imports de Vitest más
      la salida de desglose de imports.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a
      archivos modificados desde `origin/main`.
    - Los datos de tiempos de fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuración completa usan la ruta de configuración como clave; los fragmentos de CI
      con patrón de inclusión añaden el nombre del fragmento para que los fragmentos filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente sigue pasando la mayor parte de su tiempo en imports de arranque,
      mantén las dependencias pesadas detrás de una interfaz local estrecha `*.runtime.ts` y
      simula esa interfaz directamente en lugar de importar en profundidad helpers de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado con la ruta nativa del proyecto raíz para ese diff confirmado
      e imprime el tiempo de pared más el RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el árbol sucio actual
      enrutando la lista de archivos modificados por
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      la sobrecarga de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la
      suite unitaria con el paralelismo por archivo desactivado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway local loopback real con diagnósticos activados por defecto
  - Conduce churn sintética de mensajes de gateway, memoria y payloads grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` por el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnóstico
  - Afirma que la grabadora permanece acotada, las muestras RSS sintéticas permanecen por debajo del presupuesto de presión y las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril estrecho para seguimiento de regresiones de estabilidad, no un sustituto de la suite completa de Gateway

### E2E (agregado del repo)

- Comando: `pnpm test:e2e`
- Alcance:
  - Ejecuta el carril E2E de prueba de humo de gateway
  - Ejecuta el carril E2E de navegador simulado de Control UI
- Expectativas:
  - Seguro para CI y sin claves
  - Requiere que Playwright Chromium esté instalado

### E2E (prueba de humo de gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 por defecto).
  - Se ejecuta en modo silencioso por defecto para reducir la sobrecarga de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a activar la salida detallada de consola.
- Alcance:
  - Comportamiento de gateway end-to-end de múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y networking más pesado
- Expectativas:
  - Se ejecuta en CI (cuando está activado en el pipeline)
  - No requiere claves reales
  - Más piezas móviles que las pruebas unitarias (puede ser más lento)

### E2E (navegador simulado de Control UI)

- Comando: `pnpm test:ui:e2e`
- Configuración: `test/vitest/vitest.ui-e2e.config.ts`
- Archivos: `ui/src/**/*.e2e.test.ts`
- Alcance:
  - Inicia la Control UI de Vite
  - Conduce una página Chromium real mediante Playwright
  - Sustituye el WebSocket del Gateway con mocks deterministas en el navegador
- Expectativas:
  - Se ejecuta en CI como parte de `pnpm test:e2e`
  - No requiere Gateway, agentes ni claves de proveedor reales
  - La dependencia de navegador debe estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: prueba de humo del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Reutiliza un gateway OpenShell local activo
  - Crea un sandbox desde un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento del sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local `openshell` y un daemon Docker funcional
  - Requiere un gateway OpenShell local activo y su fuente de configuración
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados, luego destruye el sandbox de prueba
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para activar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI no predeterminado o a un script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para exponer la configuración del gateway registrado a la prueba aislada
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para sobrescribir la IP del gateway Docker usada por el fixture de política del host

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas live de Plugins incluidos en `extensions/`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - "¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?"
  - Detectar cambios de formato del proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de "todo"
- Las ejecuciones live usan claves de API ya exportadas y perfiles de autenticación preparados.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian material de configuración/autenticación en un directorio home temporal de pruebas para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` usa de forma predeterminada un modo más silencioso: mantiene la salida de progreso `[live] ...` y silencia los logs de arranque del Gateway y el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los logs completos de inicio.
- Rotación de claves de API (específica del proveedor): establece `*_API_KEYS` con formato separado por comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una anulación por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas a proveedores se vean activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso de proveedor/Gateway se transmitan inmediatamente durante las ejecuciones live.
  - Ajusta los Heartbeat de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Edición de lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Cambios en redes del Gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Depuración de "mi bot está caído" / fallos específicos de proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas live (que tocan red)

Para la matriz de modelos live, pruebas rápidas de backend CLI, pruebas rápidas de ACP, harness del servidor de app de Codex y todas las pruebas live de proveedores de medios (Deepgram, BytePlus, ComfyUI, imagen, música, video, harness de medios), además del manejo de credenciales para ejecuciones live, consulta [Probar suites live](/es/help/testing-live). Para la lista de verificación dedicada de actualización y validación de Plugins, consulta [Probar actualizaciones y Plugins](/es/help/testing-updates-plugins).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores de modelos live: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de claves de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local, workspace y archivo opcional de entorno de perfil. Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores live de Docker mantienen sus propios límites prácticos cuando hace falta:
  `test:docker:live-models` usa de forma predeterminada el conjunto seleccionado, compatible y de alta señal, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Establece `OPENCLAW_LIVE_MAX_MODELS`
  o las variables de entorno del Gateway cuando quieras explícitamente un límite menor o un escaneo mayor.
- `test:docker:all` compila la imagen Docker live una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego compila/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen base es solo el ejecutor Node/Git para carriles de instalación/actualización/dependencias de Plugin; esos carriles montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de app compilada. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los slots de procesos, mientras que los límites de recursos evitan que los carriles live pesados, de instalación npm y multiservicio arranquen todos a la vez. Si un solo carril es más pesado que los límites activos, el planificador aún puede iniciarlo cuando el pool está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El ejecutor realiza una comprobación previa de Docker de forma predeterminada, elimina contenedores E2E obsoletos de OpenClaw, imprime estado cada 30 segundos, guarda los tiempos de carriles correctos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de carriles seleccionados, necesidades de paquete/imagen y credenciales.
- `Package Acceptance` es la compuerta de paquete nativa de GitHub para "¿este tarball instalable funciona como producto?" Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo sube como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de volver a empaquetar la ref seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Probar actualizaciones y Plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/Plugin, la matriz de supervivencia de actualización publicada, los valores predeterminados de release y el triaje de fallos.
- Las comprobaciones de compilación y release ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el inicio previo al despacho importa dependencias de paquete como Commander, UI de prompts, undici o logging antes del despacho de comandos; también mantiene el chunk de ejecución del Gateway incluido dentro del presupuesto y rechaza importaciones estáticas de rutas Gateway frías conocidas. La prueba rápida de CLI empaquetada también cubre ayuda raíz, ayuda de onboard, ayuda de doctor, estado, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese corte, el harness tolera solo brechas de metadatos de paquetes publicados: entradas privadas omitidas del inventario de QA, falta de `gateway install --wrapper`, falta de archivos de parche en el fixture git derivado del tarball, falta de `update.channel` persistido, ubicaciones heredadas de registros de instalación de Plugins, falta de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de prueba rápida en contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.
- Los carriles Docker/Bash E2E que instalan el tarball empaquetado de OpenClaw mediante `scripts/lib/openclaw-e2e-instance.sh` limitan `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (predeterminado `600s`; establece `0` para deshabilitar el wrapper durante la depuración).

Los ejecutores Docker de modelos live también montan con bind solo los directorios home de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), luego los copian al home del contenedor antes de la ejecución para que OAuth de CLI externas pueda refrescar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba rápida de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba rápida de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba rápida del harness de servidor de app de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Pruebas rápidas de observabilidad: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` y `pnpm qa:observability:smoke` son carriles privados de checkout de código fuente de QA. Intencionalmente no forman parte de los carriles Docker de release de paquetes porque el tarball npm omite QA Lab.
- Prueba rápida live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba rápida de onboarding/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el tarball empaquetado de OpenClaw en Docker, configura OpenAI mediante onboarding con referencia de entorno y Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia el canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke del recorrido de usuario de la versión: `pnpm test:docker:release-user-journey` instala el tarball empaquetado de OpenClaw globalmente en un home de Docker limpio, ejecuta el onboarding, configura un proveedor OpenAI simulado, ejecuta un turno de agente, instala/desinstala plugins externos, configura ClickClack contra un fixture local, verifica la mensajería saliente/entrante, reinicia Gateway y ejecuta doctor.
- Smoke del onboarding tipado de la versión: `pnpm test:docker:release-typed-onboarding` instala el tarball empaquetado, conduce `openclaw onboard` mediante un TTY real, configura OpenAI como proveedor env-ref, verifica que no haya persistencia de claves sin procesar y ejecuta un turno de agente simulado.
- Smoke de medios/memoria de la versión: `pnpm test:docker:release-media-memory` instala el tarball empaquetado, verifica la comprensión de imágenes desde un adjunto PNG, la salida de generación de imágenes compatible con OpenAI, la recuperación de búsqueda en memoria y la supervivencia de la recuperación tras reiniciar Gateway.
- Smoke del recorrido de usuario de actualización de versión: `pnpm test:docker:release-upgrade-user-journey` instala de forma predeterminada la línea base publicada más reciente anterior al tarball candidato, configura el estado del proveedor/plugin/ClickClack en el paquete publicado, actualiza al tarball candidato y luego vuelve a ejecutar el recorrido principal de agente/plugin/canal. Si no existe una línea base publicada anterior, reutiliza la versión candidata. Sobrescribe la línea base con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke del marketplace de plugins de la versión: `pnpm test:docker:release-plugin-marketplace` instala desde un marketplace de fixtures local, actualiza el plugin instalado, lo desinstala y verifica que la CLI del plugin desaparezca con los metadatos de instalación podados.
- Smoke de instalación de Skills: `pnpm test:docker:skill-install` instala el tarball empaquetado de OpenClaw globalmente en Docker, deshabilita las instalaciones de archivos subidos en la configuración, resuelve el slug de skill actual en vivo de ClawHub desde la búsqueda, lo instala con `openclaw skills install` y verifica la skill instalada más los metadatos de origen/bloqueo de `.clawhub`.
- Smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala el tarball empaquetado de OpenClaw globalmente en Docker, cambia de paquete `stable` a git `dev`, verifica que el canal persistido y el plugin funcionen después de la actualización, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Smoke de superviviente de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permitidos de plugins, estado obsoleto de dependencias de plugins y archivos existentes de workspace/sesión. Ejecuta la actualización del paquete más doctor no interactivo sin proveedor en vivo ni claves de canal; luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado más los presupuestos de arranque/estado.
- Smoke de superviviente de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba las intenciones configuradas, la preservación de estado, el arranque, `/healthz`, `/readyz` y los presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al planificador agregado que expanda líneas base locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expande fixtures con forma de issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para la reparación automática de instalaciones de plugins externos de OpenClaw. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de línea base meta como `last-stable-4` o `all-since-2026.4.23`, y Full Release Validation expande la puerta de paquete release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` más `reported-issues`.
- Smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta de transcripciones de contexto de runtime más la reparación de doctor de las ramas duplicadas de reescritura de prompt afectadas.
- Smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imagen integrados en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, o copia `dist/` desde una imagen de Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke de Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. El smoke de actualización usa de forma predeterminada npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché npm aislada para que las entradas de caché propiedad de root no enmascaren el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Smoke de CLI de eliminación de agentes con workspace compartido: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila la imagen del Dockerfile raíz de forma predeterminada, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido más el comportamiento de workspace retenido. Reutiliza la imagen de install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de código fuente más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que los snapshots de roles CDP cubran URLs de enlaces, clicables promovidos por cursor, refs de iframe y metadatos de frames.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los logs de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + smoke de notification-frame sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del bundle de OpenClaw (servidor MCP stdio real + smoke de permitir/denegar de perfil OpenClaw integrado): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de hijo MCP stdio tras ejecuciones aisladas de Cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, metadatos malformados de paquete npm, refs móviles de git, kitchen-sink de ClawHub, actualizaciones de marketplace y habilitar/inspeccionar bundle de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor hermético local de fixtures de ClawHub.
- Smoke de actualización de plugin sin cambios: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor básico, instala un plugin npm, alterna habilitar/deshabilitar, lo actualiza y revierte mediante un registro npm local, elimina el código instalado y luego verifica que la desinstalación todavía elimine el estado obsoleto mientras registra métricas RSS/CPU para cada fase del ciclo de vida.
- Smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitar/inspeccionar bundle de Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre instalación, habilitación, deshabilitación, actualización, reversión y desinstalación con código faltante de plugins npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen remota compartida, los scripts la descargan si aún no está localmente. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de app compilada compartida.

Los runners de Docker con modelos en vivo también montan con bind el checkout actual como solo lectura y lo preparan en un workdir temporal dentro del contenedor. Isso mantém a imagem de runtime enxuta enquanto ainda executa Vitest contra exatamente seu código-fonte/configuração local.
