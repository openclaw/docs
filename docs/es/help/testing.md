---
read_when:
    - Ejecución de pruebas localmente o en CI
    - Añadir regresiones para errores de modelo/proveedor
    - Depuración del comportamiento del Gateway y del agente
summary: 'Kit de pruebas: suites unitarias/e2e/en vivo, ejecutores Docker y lo que cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-07-02T07:56:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo) y un conjunto pequeño
de ejecutores de Docker. Este documento es una guía de "cómo probamos":

- Qué cubre cada suite (y qué deliberadamente _no_ cubre).
- Qué comandos ejecutar para flujos de trabajo comunes (locales, antes de push, depuración).
- Cómo las pruebas en vivo descubren credenciales y seleccionan modelos/proveedores.
- Cómo añadir regresiones para problemas reales de modelos/proveedores.

<Note>
**La pila de QA (qa-lab, qa-channel, carriles de transporte en vivo)** está documentada por separado:

- [Resumen de QA](/es/concepts/qa-e2e-automation) - arquitectura, superficie de comandos, autoría de escenarios.
- [QA de Matrix](/es/concepts/qa-matrix) - referencia para `pnpm openclaw qa matrix`.
- [Cuadro de madurez](/es/maturity/scorecard) - cómo la evidencia de QA de lanzamiento respalda las decisiones de estabilidad y LTS.
- [Canal QA](/es/channels/qa-channel) - el Plugin de transporte sintético usado por escenarios respaldados por el repositorio.

Esta página cubre la ejecución de las suites de pruebas regulares y los ejecutores de Docker/Parallels. La sección de ejecutores específicos de QA a continuación ([Ejecutores específicos de QA](#qa-specific-runners)) enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Puerta completa (esperada antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos: `pnpm test:max`
- Bucle directo de observación de Vitest: `pnpm test:watch`
- La selección directa de archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando iteras sobre un único fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras confianza adicional:

- Puerta de cobertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

## Directorios temporales de prueba

Prefiere los helpers compartidos en `test/helpers/temp-dir.ts` para directorios
temporales propiedad de las pruebas. Hacen explícita la propiedad y mantienen la limpieza en el mismo
ciclo de vida de la prueba:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` no expone intencionalmente ningún método de limpieza manual; Vitest
posee la limpieza después de cada prueba. Los helpers de menor nivel existentes permanecen para pruebas que
aún no se han movido, pero las pruebas nuevas y migradas deben usar el rastreador
de limpieza automática. Evita nuevos usos manuales de `makeTempDir`, `cleanupTempDirs` o
`createTempDirTracker` y evita nuevas llamadas directas a `fs.mkdtemp*` en pruebas
salvo que un caso esté verificando explícitamente el comportamiento bruto de directorios temporales. Añade un comentario
de autorización auditable con una razón concreta cuando una prueba necesite intencionalmente un directorio temporal
directo:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Para visibilidad de migración, `node scripts/report-test-temp-creations.mjs` informa
nueva creación directa de directorios temporales y nuevo uso manual de helpers compartidos en líneas añadidas del diff
sin bloquear estilos de limpieza existentes. Su alcance de archivo sigue intencionalmente
la misma clasificación de rutas de prueba usada por `scripts/changed-lanes.mjs`
en lugar de mantener una heurística separada de nombres de archivo de helpers de prueba, mientras omite
la propia implementación del helper compartido. `check:changed` ejecuta este informe para
rutas de prueba cambiadas como señal de CI solo de advertencia; los hallazgos son anotaciones de advertencia
de GitHub, no fallos.

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos + sondas de herramienta/imagen de Gateway): `pnpm test:live`
- Apuntar a un archivo en vivo en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento de runtime: despacha `OpenClaw Performance` con
  `live_openai_candidate=true` para un turno de agente real `openai/gpt-5.5` o
  `deep_profile=true` para artefactos de CPU/heap/traza de Kova. Las ejecuciones programadas diarias
  publican artefactos de carriles de proveedor simulado, perfil profundo y GPT 5.5 en
  `openclaw/clawgrit-reports` cuando `CLAWGRIT_REPORTS_TOKEN` está configurado. El
  informe de proveedor simulado también incluye arranque de Gateway a nivel de fuente, memoria,
  presión de Plugin, bucle repetido de saludo de modelo falso y números de arranque de CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ahora ejecuta un turno de texto más una pequeña sonda de estilo lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un turno de imagen diminuto.
    Desactiva las sondas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diario y
    `OpenClaw Release Checks` manual llaman ambos al flujo de trabajo reutilizable en vivo/E2E con
    `include_live_suites: true`, que incluye trabajos de matriz de modelos en vivo de Docker separados
    fragmentados por proveedor.
  - Para reejecuciones de CI enfocadas, despacha `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añade nuevos secretos de proveedor de alta señal a `scripts/ci-hydrate-live-auth.sh`
    más `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    llamadores programados/de lanzamiento.
- Smoke de chat enlazado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker contra la ruta app-server de Codex, enlaza un
    DM sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions`, luego verifica una respuesta plana y un adjunto de imagen
    enrutados a través del enlace nativo del Plugin en lugar de ACP.
- Smoke del harness app-server de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente de Gateway a través del harness app-server de Codex propiedad del Plugin,
    verifica `/codex status` y `/codex models`, y por defecto ejercita sondas de imagen,
    MCP de cron, subagente y Guardian. Desactiva la sonda de subagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos de
    app-server de Codex. Para una comprobación enfocada de subagente, desactiva las otras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto sale después de la sonda de subagente salvo que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esté configurado.
- Smoke de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala el tarball empaquetado de OpenClaw en Docker, ejecuta onboarding con clave API
    de OpenAI y verifica que el Plugin de Codex más la dependencia `@openai/codex`
    se descargaron bajo demanda en la raíz del proyecto npm administrado.
- Smoke de dependencia de herramienta de Plugin en vivo: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un Plugin fixture con una dependencia real `slugify`, lo instala mediante
    `npm-pack:`, verifica la dependencia bajo la raíz del proyecto npm administrado,
    luego pide a un modelo OpenAI en vivo llamar a la herramienta del Plugin y devolver el slug
    oculto.
- Smoke del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación optativa de cinturón y tirantes para la superficie del comando de rescate
    del canal de mensajes. Ejercita `/crestodian status`, pone en cola un cambio persistente
    de modelo, responde `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Smoke Docker del planificador de Crestodian: `pnpm test:docker:crestodian-planner`
  - Ejecuta Crestodian en un contenedor sin configuración con una CLI falsa de Claude en `PATH`
    y verifica que el fallback difuso del planificador se traduce en una escritura de configuración tipada
    auditada.
- Smoke Docker de primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado vacío de OpenClaw, verifica el punto de entrada moderno
    onboard de Crestodian, aplica escrituras de setup/modelo/agente/Plugin de Discord + SecretRef,
    valida la configuración y verifica entradas de auditoría. La misma ruta de configuración Ring 0
    también está cubierta en QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coste Moonshot/Kimi: con `MOONSHOT_API_KEY` configurado, ejecuta
  `openclaw models list --provider moonshot --json`, luego ejecuta un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado contra `moonshot/kimi-k2.6`. Verifica que el JSON informa Moonshot/K2.6 y que la
  transcripción del asistente almacena `usage.cost` normalizado.

<Tip>
Cuando solo necesites un caso fallido, prefiere acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas abajo.
</Tip>

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de prueba principales cuando necesitas realismo de QA-lab:

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está anidada bajo
`QA-Lab - All Lanes` y la validación de lanzamiento, no como un flujo de trabajo de PR independiente.
La validación amplia debe usar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo QA de comprobaciones de lanzamiento. Las comprobaciones de lanzamiento
estables/predeterminadas mantienen el soak exhaustivo en vivo/Docker detrás de `run_release_soak=true`; el
perfil `full` fuerza la activación del soak. `QA-Lab - All Lanes`
se ejecuta cada noche en `main` y desde despacho manual con el carril de paridad simulado, el carril live
de Matrix, el carril live de Telegram administrado por Convex y el carril live de Discord
administrado por Convex como trabajos paralelos. Las comprobaciones programadas de QA y de lanzamiento pasan Matrix
`--profile fast` explícitamente, mientras que la entrada predeterminada de la CLI de Matrix y del flujo de trabajo manual
permanece en `all`; el despacho manual puede fragmentar `all` en trabajos `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release
Checks` ejecuta paridad más los carriles rápidos de Matrix y Telegram antes de la aprobación de lanzamiento,
usando `mock-openai/gpt-5.5` para las comprobaciones de transporte de lanzamiento de modo que permanezcan
deterministas y eviten el arranque normal de Plugin de proveedor. Estos Gateways de transporte en vivo
desactivan la búsqueda de memoria; el comportamiento de memoria sigue cubierto por las suites de paridad
de QA.

Los fragmentos de medios en vivo de lanzamiento completo usan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya tiene
`ffmpeg` y `ffprobe`. Los fragmentos de modelo/backend en vivo de Docker usan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>` compilada una vez por commit
seleccionado, luego la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de recompilar
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Escribe artefactos de nivel superior `qa-evidence.json`, `qa-suite-summary.json` y
    `qa-suite-report.md` para el conjunto de escenarios seleccionado, incluidas
    selecciones de escenarios de flujo mixto, Vitest y Playwright.
  - Cuando lo despacha `pnpm openclaw qa run --qa-profile <profile>`, incrusta el
    scorecard del perfil de taxonomía seleccionado en el mismo `qa-evidence.json`.
    `smoke-ci` escribe evidencia reducida, lo que establece `evidenceMode: "slim"` y omite
    `execution` por entrada. `release` cubre el segmento curado de preparación para lanzamiento;
    `all` selecciona todas las categorías de madurez activas y está pensado para despachos explícitos del flujo de trabajo
    Profile Evidence de QA cuando se necesita un artefacto de scorecard completo.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de
    Gateway aislados. `qa-channel` usa concurrencia 4 de forma predeterminada (limitada por el
    recuento de escenarios seleccionados). Usa `--concurrency <count>` para ajustar el recuento de
    workers, o `--concurrency 1` para la vía serial anterior.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para cobertura experimental
    de fixtures y mocks de protocolo sin reemplazar la vía `mock-openai` consciente de escenarios.
- `pnpm openclaw qa coverage --match <query>`
  - Busca IDs de escenarios, títulos, superficies, IDs de cobertura, referencias de docs, referencias de código,
    plugins y requisitos de proveedores, y luego imprime objetivos de suite coincidentes.
  - Usa esto antes de una ejecución de QA Lab cuando conoces el comportamiento o la ruta de archivo tocados,
    pero no el escenario más pequeño. Es solo orientativo; aun así, elige la prueba mock,
    live, Multipass, Matrix o de transporte según el comportamiento que se cambia.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta la batería live del Plugin Kitchen Sink de OpenAI mediante QA Lab. Instala
    el paquete externo Kitchen Sink, verifica el inventario de superficie del SDK de Plugin,
    prueba `/healthz` y `/readyz`, registra evidencia de CPU/RSS del Gateway,
    ejecuta un turno live de OpenAI y comprueba diagnósticos adversariales.
    Requiere autenticación live de OpenAI, como `OPENAI_API_KEY`. En sesiones Testbox hidratadas,
    carga automáticamente el perfil de autenticación live de Testbox cuando el helper
    `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de arranque del Gateway más un pequeño paquete de escenarios mock de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observación de CPU
    en `.artifacts/gateway-cpu-scenarios/`.
  - Marca solo observaciones sostenidas de CPU caliente de forma predeterminada (`--cpu-core-warn`
    más `--hot-wall-warn-ms`), por lo que las ráfagas breves de arranque se registran como métricas
    sin parecerse a la regresión de Gateway fijado durante minutos.
  - Usa artefactos `dist` compilados; ejecuta una compilación primero cuando el checkout aún no
    tenga salida de runtime reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux Multipass desechable.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas marcas de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA admitidas que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor live de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante
    el workspace montado.
  - Escribe el informe y el resumen normales de QA más los registros de Multipass en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA al estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm desde el checkout actual, lo instala globalmente en
    Docker, ejecuta onboarding no interactivo con clave de API de OpenAI, configura Telegram
    de forma predeterminada, verifica que el runtime del Plugin empaquetado cargue sin reparación de dependencias
    de arranque, ejecuta doctor y ejecuta un turno de agente local contra un
    endpoint OpenAI simulado.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma vía de instalación empaquetada
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta un smoke determinista de app compilada en Docker para transcripciones de contexto de runtime embebido.
    Verifica que el contexto de runtime oculto de OpenClaw se persista como un
    mensaje personalizado no mostrado en lugar de filtrarse en el turno visible del usuario,
    luego siembra un JSONL de sesión rota afectada y verifica que
    `openclaw doctor --fix` lo reescriba a la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un candidato de paquete OpenClaw en Docker, ejecuta onboarding de paquete instalado,
    configura Telegram mediante la CLI instalada y luego reutiliza la vía live de QA de Telegram
    con ese paquete instalado como el Gateway SUT.
  - El wrapper monta solo el código fuente del harness `qa-lab` desde el checkout; el
    paquete instalado posee `dist`, `openclaw/plugin-sdk` y el runtime de plugins incluidos,
    de modo que la vía no mezcla plugins del checkout actual en el paquete
    bajo prueba.
  - El valor predeterminado es `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; establece
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalar desde el registro.
  - Emite temporización RTT repetida en `qa-evidence.json` de forma predeterminada con
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescribe
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la ejecución RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` acepta una lista separada por comas de
    IDs de comprobación de QA de Telegram para muestrear; cuando no se establece, la comprobación predeterminada apta para RTT
    es `telegram-mentioned-message-reply`.
  - Usa las mismas credenciales env de Telegram o fuente de credenciales Convex que
    `pnpm openclaw qa telegram`. Para automatización de CI/lanzamiento, establece
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` más
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol Convex están presentes en CI,
    el wrapper de Docker selecciona Convex automáticamente.
  - El wrapper valida el env de credenciales de Telegram o Convex en el host antes del
    trabajo de build/install de Docker. Establece `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo cuando depures deliberadamente la configuración previa a credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe el
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para esta vía. Cuando se seleccionan credenciales Convex
    y no se establece ningún rol, el wrapper usa `ci` en CI y
    `maintainer` fuera de CI.
  - GitHub Actions expone esta vía como el flujo de trabajo manual de mantenedores
    `NPM Telegram Beta E2E`. No se ejecuta en merge. El flujo de trabajo usa el entorno
    `qa-live-shared` y leases de credenciales CI de Convex.
- GitHub Actions también expone `Package Acceptance` para prueba de producto lateral
  contra un paquete candidato. Acepta una ref confiable, una especificación npm publicada,
  una URL HTTPS de tarball más SHA-256, o un artefacto tarball de otra ejecución, sube
  el `openclaw-current.tgz` normalizado como `package-under-test`, y luego ejecuta el
  programador Docker E2E existente con perfiles de vía smoke, package, product, full o custom.
  Establece `telegram_mode=mock-openai` o `live-frontier` para ejecutar el
  flujo de trabajo de QA de Telegram contra el mismo artefacto `package-under-test`.
  - Prueba de producto de la beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba de URL exacta de tarball requiere un digest y usa la política de seguridad de URL pública:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Los mirrors de tarball empresariales/privados usan una política explícita de fuente confiable:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lee `.github/package-trusted-sources.json` desde la ref confiable del flujo de trabajo y no acepta credenciales de URL ni una omisión de red privada por entrada de flujo de trabajo. Si la política nombrada declara autenticación bearer, configura el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prueba de artefacto descarga un artefacto tarball desde otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y luego habilita canales/plugins incluidos mediante ediciones de configuración.
  - Verifica que el descubrimiento de setup deje ausentes los plugins descargables no configurados,
    que la primera reparación configurada de doctor instale cada Plugin descargable faltante
    explícitamente, y que un segundo reinicio no ejecute una reparación de dependencias
    oculta.
  - También instala una baseline npm anterior conocida, habilita Telegram antes de ejecutar
    `openclaw update --tag <candidate>`, y verifica que el doctor posterior a la actualización del candidato
    limpie restos de dependencias de plugins heredadas sin una reparación postinstall del lado del
    harness.
- `pnpm test:parallels:npm-update`
  - Ejecuta el smoke nativo de actualización de instalación empaquetada en invitados Parallels. Cada
    plataforma seleccionada instala primero el paquete baseline solicitado, luego ejecuta
    el comando `openclaw update` instalado en el mismo invitado y verifica la
    versión instalada, el estado de actualización, la preparación del Gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras
    iteras en un invitado. Usa `--json` para la ruta del artefacto de resumen y
    el estado por vía.
  - La vía de OpenAI usa `openai/gpt-5.5` para la prueba live del turno de agente de forma
    predeterminada. Pasa `--model <provider/model>` o establece
    `OPENCLAW_PARALLELS_OPENAI_MODEL` cuando valides deliberadamente otro
    modelo de OpenAI.
  - Envuelve ejecuciones locales largas en un timeout del host para que los bloqueos de transporte de Parallels no puedan
    consumir el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros de vía anidados en `/tmp/openclaw-parallels-npm-update.*`.
    Inspecciona `windows-update.log`, `macos-update.log` o `linux-update.log`
    antes de asumir que el wrapper externo está colgado.
  - La actualización de Windows puede dedicar de 10 a 15 minutos al doctor posterior a la actualización y al trabajo de
    actualización de paquetes en un invitado frío; eso sigue siendo saludable cuando el registro debug npm
    anidado avanza.
  - No ejecutes este wrapper agregado en paralelo con vías smoke individuales de Parallels
    macOS, Windows o Linux. Comparten estado de VM y pueden colisionar en
    restauración de snapshot, servicio de paquetes o estado del Gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidades como voz, generación de imágenes y comprensión de medios
    se cargan mediante APIs de runtime incluidas, incluso cuando el turno del agente
    solo comprueba una respuesta de texto simple.

- `pnpm openclaw qa aimock`
  - Inicia solo el servidor proveedor AIMock local para pruebas de humo
    directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la ruta de QA en vivo de Matrix contra un homeserver Tuwunel desechable respaldado por Docker. Solo checkout de código fuente; las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completo, catálogo de perfiles/escenarios, variables de entorno y disposición de artefactos: [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta la ruta de QA en vivo de Telegram contra un grupo privado real usando los tokens de bot del controlador y del SUT desde el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas. Usa el modo de entorno de forma predeterminada, o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por reservas agrupadas.
  - Los valores predeterminados cubren canary, control de menciones, direccionamiento de comandos, `/status`, respuestas mencionadas de bot a bot y respuestas de comandos nativos del núcleo. Los valores predeterminados de `mock-openai` también cubren regresiones deterministas de cadena de respuestas y streaming del mensaje final de Telegram. Usa `--list-scenarios` para sondeos opcionales como `session_status`.
  - Sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
    quieras artefactos sin un código de salida fallido.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable de bot a bot, habilita el modo de comunicación bot a bot en `@BotFather` para ambos bots y asegúrate de que el bot controlador pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y `qa-evidence.json` bajo `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen RTT desde la solicitud de envío del controlador hasta la respuesta observada del SUT.

`Mantis Telegram Live` es el envoltorio de evidencia de PR alrededor de esta ruta. Ejecuta la
referencia candidata con credenciales de Telegram reservadas por Convex, renderiza el paquete
redactado de informe/evidencia de QA en un navegador de escritorio de Crabbox, graba evidencia MP4,
genera un GIF recortado por movimiento, sube el paquete de artefactos y publica evidencia inline en el PR
mediante la GitHub App de Mantis cuando `pr_number` está definido. Los mantenedores pueden
iniciarlo desde la UI de Actions mediante `Mantis Scenario` (`scenario_id:
telegram-live`) o directamente desde un comentario en una pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` es el envoltorio agéntico nativo de Telegram Desktop
antes/después para prueba visual de PR. Inícialo desde la UI de Actions con
`instructions` de formato libre, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), o desde un comentario de PR:

```text
@openclaw-mantis telegram desktop proof
```

El agente de Mantis lee el PR, decide qué comportamiento visible en Telegram prueba el
cambio, ejecuta la ruta de prueba de Telegram Desktop de usuario real de Crabbox en las referencias
base y candidata, itera hasta que los GIF nativos sean útiles, escribe un manifiesto
`motionPreview` emparejado y publica la misma tabla de GIF de 2 columnas mediante la
GitHub App de Mantis cuando `pr_number` está definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Reserva o reutiliza un escritorio Linux de Crabbox, instala Telegram Desktop nativo, configura OpenClaw con un token de bot SUT de Telegram reservado, inicia el Gateway y graba evidencia de captura de pantalla/MP4 desde el escritorio VNC visible.
  - El valor predeterminado es `--credential-source convex`, para que los workflows solo necesiten el secreto del broker de Convex. Usa `--credential-source env` con las mismas variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop todavía necesita un inicio de sesión/perfil de usuario. El token de bot configura solo OpenClaw. Usa `--telegram-profile-archive-env <name>` para un archivo de perfil `.tgz` en base64, o usa `--keep-lease` e inicia sesión manualmente mediante VNC una vez.
  - Escribe `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4` bajo el directorio de salida.

Las rutas de transporte en vivo comparten un contrato estándar para que los nuevos transportes no diverjan; la matriz de cobertura por ruta está en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` es la suite sintética amplia y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
QA de transporte en vivo, el laboratorio de QA adquiere una reserva exclusiva de un grupo respaldado por Convex, envía heartbeats para esa
reserva mientras la ruta se ejecuta y libera la reserva al apagarse. El nombre de la sección es anterior al
soporte para Discord, Slack y WhatsApp; el contrato de reserva se comparte entre tipos.

Andamiaje de referencia del proyecto Convex:

- `qa/convex-credential-broker/`

Variables de entorno requeridas:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección de rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado de entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (por defecto `ci` en CI, `maintainer` en caso contrario)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valor predeterminado `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valor predeterminado `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valor predeterminado `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valor predeterminado `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valor predeterminado `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de traza opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL Convex `http://` de loopback para desarrollo solo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` en operación normal.

Los comandos de administración para mantenedores (agregar/eliminar/listar del grupo) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de ejecuciones en vivo para comprobar la URL del sitio Convex, los secretos del broker,
el prefijo de endpoint, el timeout HTTP y el alcance de administración/listado sin imprimir
valores secretos. Usa `--json` para salida legible por máquina en scripts y utilidades de CI.

Contrato de endpoint predeterminado (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitud: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Éxito: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Agotado/reintentable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Éxito: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /release`
  - Solicitud: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Éxito: `{ status: "ok" }` (o `2xx` vacío)
- `POST /admin/add` (solo secreto de mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto de mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección de reserva activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto de mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma del payload para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena de id numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza payloads mal formados.

Forma del payload para el tipo usuario real de Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` está reservado para el workflow de prueba de Telegram Desktop de Mantis. Las rutas genéricas de QA Lab no deben adquirirlo.

Payloads multicanal validados por el broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Las rutas de Slack también pueden reservar desde el grupo, pero la validación del payload de Slack actualmente
vive en el ejecutor de QA de Slack en lugar de en el broker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para filas de Slack.

### Agregar un canal a QA

La arquitectura y los nombres de ayudantes de escenarios para nuevos adaptadores de canal están en [Resumen de QA → Agregar un canal](/es/concepts/qa-e2e-automation#adding-a-channel). El mínimo requerido: implementar el ejecutor de transporte en la costura de host compartida `qa-lab`, declarar `qaRunners` en el manifiesto del Plugin, montar como `openclaw qa <runner>` y crear escenarios bajo `qa/scenarios/`.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como "realismo creciente" (y mayor inestabilidad/coste):

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones no dirigidas usan el conjunto de shards `vitest.full-*.config.ts` y pueden expandir shards multiproyecto en configuraciones por proyecto para programación paralela
- Archivos: inventarios de núcleo/unitarios bajo `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de UI se ejecutan en el shard dedicado `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación del Gateway, enrutamiento, herramientas, parsing, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
  - Las pruebas del resolver y del cargador de superficie pública deben demostrar el comportamiento de fallback amplio de `api.js` y
    `runtime-api.js` con fixtures de Plugin diminutos generados, no con
    APIs reales de código fuente de Plugins incluidos. Las cargas de API de Plugins reales pertenecen a
    suites de contrato/integración propiedad del Plugin.

Política de dependencias nativas:

- Las instalaciones de prueba predeterminadas omiten builds opcionales nativas de opus de Discord. La voz de Discord usa `libopus-wasm` incluido, y `@discordjs/opus` permanece deshabilitado en `allowBuilds` para que las pruebas locales y las rutas de Testbox no compilen el addon nativo.
- Compara el rendimiento de opus nativo en el repo de benchmarks de `libopus-wasm`, no en los bucles predeterminados de instalación/prueba de OpenClaw. No establezcas `@discordjs/opus` en `true` en el `allowBuilds` predeterminado; eso hace que bucles no relacionados de instalación/prueba compilen código nativo.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` sin objetivo ejecuta doce configuraciones de shards más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigante del proyecto raíz. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
    - `pnpm test --watch` sigue usando el grafo de proyectos raíz nativo de `vitest.config.ts`, porque un bucle de observación con múltiples shards no es práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio por lanes con alcance, por lo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar todo el coste de arranque del proyecto raíz.
    - `pnpm test:changed` expande las rutas de git modificadas en lanes baratas con alcance de forma predeterminada: ediciones directas de pruebas, archivos `*.test.ts` hermanos, mapeos explícitos de código fuente y dependientes locales del grafo de imports. Las ediciones de config/setup/package no ejecutan pruebas de forma amplia a menos que uses explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta de comprobación local inteligente normal para trabajo acotado. Clasifica el diff en core, pruebas de core, extensiones, pruebas de extensiones, apps, docs, metadatos de release, herramientas live Docker y tooling, y luego ejecuta los comandos de typecheck, lint y guard correspondientes. No ejecuta pruebas Vitest; llama a `pnpm test:changed` o a `pnpm test <target>` explícito para prueba de tests. Los incrementos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/config/dependencias raíz, con un guard que rechaza cambios de package fuera del campo de versión de nivel superior.
    - Las ediciones del arnés live Docker ACP ejecutan comprobaciones enfocadas: sintaxis de shell para los scripts de autenticación live Docker y una ejecución de prueba del planificador live Docker. Los cambios de `package.json` se incluyen solo cuando el diff está limitado a `scripts["test:docker:live-*"]`; las ediciones de dependencias, exports, versión y otras superficies de package siguen usando los guards más amplios.
    - Las pruebas unitarias ligeras en imports de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por la lane `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados de runtime permanecen en las lanes existentes.
    - Algunos archivos fuente auxiliares de `plugin-sdk` y `commands` también mapean ejecuciones en modo changed a pruebas hermanas explícitas en esas lanes ligeras, por lo que las ediciones de helpers evitan volver a ejecutar toda la suite pesada de ese directorio.
    - `auto-reply` tiene buckets dedicados para helpers core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. CI divide además el subárbol de reply en shards de agent-runner, dispatch y commands/state-routing para que un bucket pesado en imports no sea dueño de toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de extensiones y el shard `agentic-plugins` solo de release. Full Release Validation lanza el workflow hijo separado `Plugin Prerelease` para esas suites pesadas en plugins/extensiones sobre candidatos de release.

  </Accordion>

  <Accordion title="Cobertura del runner embebido">

    - Cuando cambies entradas de descubrimiento de herramientas de mensaje o contexto
      de runtime de compaction, conserva ambos niveles de cobertura.
    - Añade regresiones enfocadas de helpers para límites puros de enrutamiento y
      normalización.
    - Mantén sanas las suites de integración del runner embebido:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` y
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Esas suites verifican que los ids con alcance y el comportamiento de compaction sigan
      fluyendo por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de helpers
      no son un sustituto suficiente para esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados de pool e aislamiento de Vitest">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y usa el
      runner no aislado en los proyectos raíz, e2e y configuraciones live.
    - La lane UI raíz conserva su setup y optimizador de `jsdom`, pero también se ejecuta en el
      runner compartido no aislado.
    - Cada shard de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` para los procesos Node hijos de Vitest
      de forma predeterminada para reducir la rotación de compilación de V8 durante grandes ejecuciones locales.
      Configura `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento estándar de V8.
    - `scripts/run-vitest.mjs` finaliza las ejecuciones Vitest explícitas sin watch después de
      5 minutos sin salida por stdout o stderr. Configura
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desactivar el watchdog en una
      investigación intencionadamente silenciosa.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué lanes arquitectónicas activa un diff.
    - El hook pre-commit solo aplica formato. Vuelve a añadir al staging los archivos formateados y
      no ejecuta lint, typecheck ni pruebas.
    - Ejecuta `pnpm check:changed` explícitamente antes del handoff o push cuando
      necesites la puerta de comprobación local inteligente.
    - `pnpm test:changed` se enruta por lanes baratas con alcance de forma predeterminada. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      decida que una edición de arnés, config, package o contrato realmente necesita cobertura Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` conservan el mismo comportamiento de enrutamiento,
      solo con un límite de workers más alto.
    - El autoescalado local de workers es intencionadamente conservador y se reduce
      cuando el promedio de carga del host ya es alto, por lo que múltiples ejecuciones
      concurrentes de Vitest causan menos daño de forma predeterminada.
    - La configuración base de Vitest marca los proyectos/archivos de configuración como
      `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambia
      el cableado de pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles;
      configura `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres
      una ubicación explícita de caché para profiling directo.

  </Accordion>

  <Accordion title="Depuración de rendimiento">

    - `pnpm test:perf:imports` habilita el informe de duración de imports de Vitest más
      salida de desglose de imports.
    - `pnpm test:perf:imports:changed` acota la misma vista de profiling a
      archivos modificados desde `origin/main`.
    - Los datos de tiempos de shards se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de config completa usan la ruta de config como clave; los shards de CI con patrón de inclusión
      añaden el nombre del shard para que los shards filtrados puedan rastrearse
      por separado.
    - Cuando una prueba caliente aún pasa la mayor parte del tiempo en imports de arranque,
      mantén las dependencias pesadas detrás de una costura local estrecha `*.runtime.ts` y
      mockea esa costura directamente en lugar de hacer deep-import de helpers de runtime solo
      para pasarlos por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed`
      enrutado con la ruta nativa del proyecto raíz para ese diff confirmado
      e imprime tiempo de reloj más RSS máximo en macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkea el árbol sucio actual
      enrutando la lista de archivos modificados por
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      el overhead de arranque y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del runner para la
      suite unitaria con paralelismo de archivos desactivado.

  </Accordion>
</AccordionGroup>

### Estabilidad (gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forzada a un worker
- Alcance:
  - Inicia un Gateway loopback real con diagnósticos habilitados de forma predeterminada
  - Conduce tráfico sintético de mensajes de gateway, memoria y payloads grandes por la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` sobre el RPC WS del Gateway
  - Cubre helpers de persistencia del paquete de estabilidad de diagnósticos
  - Afirma que el recorder permanece acotado, que las muestras RSS sintéticas se mantienen por debajo del presupuesto de presión y que las profundidades de cola por sesión vuelven a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Lane estrecha para seguimiento de regresiones de estabilidad, no un sustituto de la suite Gateway completa

### E2E (agregado del repo)

- Comando: `pnpm test:e2e`
- Alcance:
  - Ejecuta la lane E2E de smoke del gateway
  - Ejecuta la lane E2E de navegador mockeado de Control UI
- Expectativas:
  - Seguro para CI y sin claves
  - Requiere que Playwright Chromium esté instalado

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos bajo `extensions/`
- Valores predeterminados de runtime:
  - Usa `threads` de Vitest con `isolate: false`, coincidiendo con el resto del repo.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir el overhead de E/S de consola.
- Overrides útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de workers (limitado a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida de consola detallada.
- Alcance:
  - Comportamiento end-to-end de gateway multiinstancia
  - Superficies WebSocket/HTTP, emparejamiento de nodos y networking más pesado
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No se requieren claves reales
  - Más partes móviles que las pruebas unitarias (puede ser más lento)

### E2E (navegador mockeado de Control UI)

- Comando: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Archivos: `ui/src/**/*.e2e.test.ts`
- Alcance:
  - Inicia la Vite Control UI
  - Conduce una página real de Chromium mediante Playwright
  - Reemplaza el WebSocket del Gateway por mocks deterministas en el navegador
- Expectativas:
  - Se ejecuta en CI como parte de `pnpm test:e2e`
  - No se requieren Gateway, agentes ni claves de proveedores reales
  - La dependencia del navegador debe estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Alcance:
  - Reutiliza un gateway local activo de OpenShell
  - Crea un sandbox desde un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento de sistema de archivos canónico remoto mediante el puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local `openshell` más un daemon Docker funcional
  - Requiere un gateway local activo de OpenShell y su fuente de config
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados y luego destruye el sandbox de prueba
- Overrides útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI o script wrapper no predeterminado
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para exponer la config del gateway registrado a la prueba aislada
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para sobrescribir la IP del gateway Docker usada por el fixture de política del host

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos bajo `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - "¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?"
  - Detectar cambios de formato del proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de velocidad
- Expectativas:
  - No es estable para CI por diseño (redes reales, políticas reales de proveedores, cuotas, interrupciones)
  - Cuesta dinero / usa límites de velocidad
  - Preferir ejecutar subconjuntos acotados en lugar de "todo"
- Las ejecuciones en vivo usan claves de API ya exportadas y perfiles de autenticación preparados.
- De forma predeterminada, las ejecuciones en vivo aún aíslan `HOME` y copian el material de configuración/autenticación en un directorio personal temporal de prueba para que los fixtures unitarios no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas en vivo usen tu directorio personal real.
- `pnpm test:live` usa de forma predeterminada un modo más silencioso: mantiene la salida de progreso `[live] ...` y silencia los registros de arranque de Gateway/el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de inicio.
- Rotación de claves de API (específica del proveedor): establece `*_API_KEYS` con formato de comas/puntos y comas o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una anulación por ejecución en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de velocidad.
- Salida de progreso/Heartbeat:
  - Las suites en vivo ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor sean visiblemente activas incluso cuando la captura de consola de Vitest está silenciosa.
  - `vitest.live.config.ts` deshabilita la intercepción de consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajusta los Heartbeats de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeats de Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Editar lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Tocar redes de Gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Depurar "mi bot está caído" / fallos específicos del proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Pruebas en vivo (que tocan la red)

Para la matriz de modelos en vivo, smokes de backend CLI, smokes ACP, arnés de servidor de app Codex
y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen,
música, video, arnés multimedia), además de la gestión de credenciales para ejecuciones en vivo, consulta
[Pruebas de suites en vivo](/es/help/testing-live). Para la lista de verificación dedicada de actualización y
validación de Plugin, consulta
[Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo en vivo correspondiente de claves de perfil dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración local, espacio de trabajo y archivo opcional de entorno de perfil. Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores Docker en vivo mantienen sus propios límites prácticos donde hace falta:
  `test:docker:live-models` usa de forma predeterminada el conjunto curado compatible de alta señal, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Establece `OPENCLAW_LIVE_MAX_MODELS`
  o las variables de entorno de Gateway cuando quieras explícitamente un límite menor o un escaneo mayor.
- `test:docker:all` construye la imagen Docker en vivo una vez mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball npm mediante `scripts/package-openclaw-for-docker.mjs` y luego construye/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es solo el ejecutor Node/Git para carriles de instalación/actualización/dependencias de Plugin; esos carriles montan el tarball preconstruido. La imagen funcional instala el mismo tarball en `/app` para carriles de funcionalidad de app construida. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El agregado usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de procesos, mientras que los límites de recursos evitan que carriles pesados en vivo, de instalación npm y de varios servicios comiencen todos a la vez. Si un solo carril es más pesado que los límites activos, el planificador aún puede iniciarlo cuando el grupo está vacío y luego lo mantiene ejecutándose solo hasta que vuelva a haber capacidad. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajusta `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo cuando el host Docker tenga más margen. El ejecutor realiza una comprobación previa de Docker de forma predeterminada, elimina contenedores OpenClaw E2E obsoletos, imprime estado cada 30 segundos, almacena los tiempos de carriles exitosos en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero los carriles más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de carriles sin construir ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI para los carriles seleccionados, necesidades de paquete/imagen y credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para "¿este tarball instalable funciona como producto?". Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carga como `package-under-test` y luego ejecuta los carriles Docker E2E reutilizables contra ese tarball exacto en lugar de reempaquetar la ref seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full`. Consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins) para el contrato de paquete/actualización/Plugin, la matriz de supervivencia de actualización publicada, los valores predeterminados de lanzamiento y el triaje de fallos.
- Las comprobaciones de compilación y lanzamiento ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo construido estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si el arranque previo al despacho importa dependencias de paquete como Commander, interfaz de prompts, undici o logging antes del despacho de comandos; también mantiene el chunk incluido de ejecución de Gateway dentro del presupuesto y rechaza importaciones estáticas de rutas Gateway frías conocidas. El smoke de CLI empaquetado también cubre ayuda raíz, ayuda de onboarding, ayuda de doctor, status, esquema de configuración y un comando de lista de modelos.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese corte, el arnés tolera solo brechas de metadatos de paquetes enviados: entradas privadas omitidas de inventario de QA, ausencia de `gateway install --wrapper`, ausencia de archivos de parche en el fixture git derivado del tarball, ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de Plugin, ausencia de persistencia de registros de instalación de marketplace y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas son fallos estrictos.
- Ejecutores de smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.
- Los carriles Docker/Bash E2E que instalan el tarball empaquetado de OpenClaw mediante `scripts/lib/openclaw-e2e-instance.sh` limitan `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (predeterminado `600s`; establece `0` para deshabilitar el wrapper durante la depuración).

Los ejecutores Docker de modelos en vivo también montan con bind solo los directorios personales de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada) y luego los copian al directorio personal del contenedor antes de la ejecución para que OAuth de CLI externa pueda renovar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del arnés de servidor de app Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smokes de observabilidad: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` y `pnpm qa:observability:smoke` son carriles privados de QA de checkout de código fuente. Intencionalmente no forman parte de los carriles de lanzamiento Docker de paquetes porque el tarball npm omite QA Lab.
- Smoke en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, andamiaje completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente con tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el tarball empaquetado de OpenClaw en Docker, configura OpenAI mediante onboarding con referencia de entorno más Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente OpenAI simulado. Reutiliza un tarball preconstruido con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la reconstrucción del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambia de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Prueba smoke del recorrido de usuario de versión: `pnpm test:docker:release-user-journey` instala globalmente el tarball empaquetado de OpenClaw en un home limpio de Docker, ejecuta el onboarding, configura un proveedor OpenAI simulado, ejecuta un turno de agente, instala/desinstala Plugins externos, configura ClickClack contra un fixture local, verifica la mensajería saliente/entrante, reinicia Gateway y ejecuta doctor.
- Prueba smoke de onboarding tipado de versión: `pnpm test:docker:release-typed-onboarding` instala el tarball empaquetado, conduce `openclaw onboard` a través de una TTY real, configura OpenAI como proveedor con referencia de entorno, verifica que no haya persistencia de claves sin procesar y ejecuta un turno de agente simulado.
- Prueba smoke de medios/memoria de versión: `pnpm test:docker:release-media-memory` instala el tarball empaquetado, verifica la comprensión de imágenes desde un adjunto PNG, la salida de generación de imágenes compatible con OpenAI, la recuperación de búsqueda en memoria y la supervivencia de la recuperación tras reiniciar Gateway.
- Prueba smoke del recorrido de usuario de actualización de versión: `pnpm test:docker:release-upgrade-user-journey` instala de forma predeterminada la línea base publicada más reciente anterior al tarball candidato, configura el estado de proveedor/Plugin/ClickClack en el paquete publicado, actualiza al tarball candidato y luego vuelve a ejecutar el recorrido principal de agente/Plugin/canal. Si no existe una línea base publicada anterior, reutiliza la versión candidata. Sobrescribe la línea base con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Prueba smoke del marketplace de Plugins de versión: `pnpm test:docker:release-plugin-marketplace` instala desde un marketplace de fixture local, actualiza el Plugin instalado, lo desinstala y verifica que la CLI del Plugin desaparezca con los metadatos de instalación depurados.
- Prueba smoke de instalación de Skills: `pnpm test:docker:skill-install` instala globalmente el tarball empaquetado de OpenClaw en Docker, deshabilita las instalaciones de archivos subidos en la configuración, resuelve desde la búsqueda el slug actual en vivo de la skill de ClawHub, la instala con `openclaw skills install` y verifica la skill instalada junto con los metadatos de origen/bloqueo de `.clawhub`.
- Prueba smoke de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia del paquete `stable` a git `dev`, verifica que el canal persistido y el Plugin funcionen después de la actualización, luego vuelve al paquete `stable` y comprueba el estado de actualización.
- Prueba smoke de supervivencia de actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo con agentes, configuración de canal, listas de permitidos de Plugins, estado obsoleto de dependencias de Plugins y archivos existentes de workspace/sesión. Ejecuta una actualización de paquete más doctor no interactivo sin proveedor en vivo ni claves de canal, luego inicia un Gateway de loopback y comprueba la preservación de configuración/estado junto con presupuestos de inicio/estado.
- Prueba smoke de supervivencia de actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura esa línea base con una receta de comandos incorporada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de loopback y comprueba intenciones configuradas, preservación de estado, inicio, `/healthz`, `/readyz` y presupuestos de estado RPC. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, pide al planificador agregado que expanda líneas base locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expande fixtures con forma de incidencia con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para la reparación automática de instalaciones de Plugins externos de OpenClaw. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de línea base meta como `last-stable-4` o `all-since-2026.4.23`, y Full Release Validation expande la puerta del paquete de release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` más `reported-issues`.
- Prueba smoke de contexto de runtime de sesión: `pnpm test:docker:session-runtime-context` verifica la persistencia oculta del transcrito de contexto de runtime junto con la reparación de doctor de las ramas afectadas duplicadas de reescritura de prompts.
- Prueba smoke de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un home aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imágenes incluidos en lugar de quedarse colgado. Reutiliza un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omite la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copia `dist/` desde una imagen Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba smoke de Docker del instalador: `bash scripts/test-install-sh-docker.sh` comparte una caché npm entre sus contenedores root, update y direct-npm. La prueba smoke de actualización usa de forma predeterminada npm `latest` como línea base estable antes de actualizar al tarball candidato. Sobrescribe con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, o con la entrada `update_baseline_version` del workflow Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Define `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché root/update/direct-npm en nuevas ejecuciones locales.
- Install Smoke CI omite la actualización global direct-npm duplicada con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecuta el script localmente sin ese env cuando se necesite cobertura directa de `npm install -g`.
- Prueba smoke de CLI de eliminación de workspace compartido de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen Dockerfile raíz, siembra dos agentes con un workspace en un home de contenedor aislado, ejecuta `agents delete --json` y verifica JSON válido junto con el comportamiento de workspace retenido. Reutiliza la imagen install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes de Gateway (dos contenedores, autenticación WS + salud): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Prueba smoke de instantánea CDP de navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de origen más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de rol CDP cubran URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- Regresión de razonamiento mínimo de OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través de Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, luego fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros de Gateway.
- Puente de canal MCP (Gateway sembrado + puente stdio + prueba smoke de frame de notificación Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete OpenClaw (servidor MCP stdio real + prueba smoke de permitir/denegar del perfil OpenClaw integrado): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagente (Gateway real + desmontaje de proceso hijo MCP stdio tras ejecuciones aisladas de cron y subagente de una sola vez): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, metadatos de paquete npm malformados, refs móviles de git, ClawHub kitchen-sink, actualizaciones de marketplace y habilitación/inspección de paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sobrescribe el par predeterminado de paquete/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor de fixture local hermético de ClawHub.
- Prueba smoke de actualización de Plugin sin cambios: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba smoke de matriz de ciclo de vida de Plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor básico, instala un Plugin npm, alterna habilitar/deshabilitar, lo actualiza y degrada a través de un registro npm local, elimina el código instalado y luego verifica que la desinstalación aún elimine el estado obsoleto mientras registra métricas de RSS/CPU para cada fase del ciclo de vida.
- Prueba smoke de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre pruebas smoke de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitación/inspección de paquete Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de actualización sin cambios para Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre instalación, habilitación, deshabilitación, actualización, degradación y desinstalación con código ausente de Plugins npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sobrescrituras de imagen específicas de suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando están definidas. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si aún no está local. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles porque validan el comportamiento de paquete/instalación en lugar del runtime de aplicación compilada compartido.

Los runners Docker de modelos en vivo también montan con bind mount el checkout actual como solo lectura y
lo preparan en un workdir temporal dentro del contenedor. Esto mantiene ligera la imagen
de runtime mientras Vitest sigue ejecutándose contra tu fuente/configuración local exacta.
El paso de preparación omite cachés grandes solo locales y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida `.build` locales de apps o
de Gradle para que las ejecuciones Docker en vivo no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las sondas en vivo del gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura en vivo del gateway
de ese carril Docker.
`test:docker:openwebui` es una prueba smoke de compatibilidad de nivel más alto: inicia un
contenedor de gateway OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor Open WebUI fijado contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y luego envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI.
Establece `OPENWEBUI_SMOKE_MODE=models` para comprobaciones de CI de ruta de release que deban detenerse
después del inicio de sesión en Open WebUI y el descubrimiento de modelos, sin esperar una
finalización de modelo en vivo.
La primera ejecución puede ser notablemente más lenta porque Docker quizá tenga que descargar la
imagen de Open WebUI y Open WebUI quizá tenga que terminar su propia configuración de arranque en frío.
Este carril espera una clave de modelo en vivo utilizable. Proporciónala mediante el entorno
del proceso, perfiles de autenticación preparados o un `OPENCLAW_PROFILE_FILE` explícito.
Las ejecuciones correctas imprimen un pequeño payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor Gateway
sembrado, inicia un segundo contenedor que lanza `openclaw mcp serve` y luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos,
comportamiento de cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canal +
permisos estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente los frames MCP stdio sin procesar para que la prueba smoke valide lo que el
puente emite realmente, no solo lo que casualmente expone un SDK de cliente específico.
`test:docker:agent-bundle-mcp-tools` es determinista y no necesita una clave de
modelo en vivo. Compila la imagen Docker del repo, inicia un servidor de sonda MCP stdio real
dentro del contenedor, materializa ese servidor mediante el runtime MCP del bundle OpenClaw
integrado, ejecuta la herramienta y luego verifica que `coding` y `messaging` conserven
herramientas `bundle-mcp`, mientras `minimal` y `tools.deny: ["bundle-mcp"]` las filtran.
`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de modelo en vivo.
Inicia un Gateway sembrado con un servidor de sonda MCP stdio real, ejecuta un
turno cron aislado y un turno hijo único `sessions_spawn`, y luego verifica
que el proceso hijo MCP salga después de cada ejecución.

Prueba smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de trabajo de regresión/depuración. Puede volver a necesitarse para validar el enrutamiento de hilos ACP, así que no lo elimines.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado y cargado antes de ejecutar pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar solo las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, usando directorios temporales de configuración/workspace y sin montajes externos de autenticación de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones de CLI en caché dentro de Docker
- Los directorios/archivos externos de autenticación de CLI bajo `$HOME` se montan como solo lectura bajo `/host-auth...` y luego se copian en `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos desde `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescribe manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesitan recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales vengan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para la prueba smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir el prompt de comprobación nonce usado por la prueba smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta de imagen Open WebUI fijada

## Comprobación básica de documentación

Ejecuta comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anclas Mintlify cuando también necesites comprobaciones de encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de "pipeline real" sin proveedores reales:

- Llamadas a herramientas del Gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad de agentes (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como "evaluaciones de fiabilidad de agentes":

- Llamadas a herramientas simuladas mediante el gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos de asistente de extremo a extremo que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Lo que todavía falta para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando las Skills se listan en el prompt, ¿el agente elige la skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarla y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios multivuelta que afirman el orden de herramientas, la conservación del historial de sesión y los límites del sandbox.

Las evaluaciones futuras deben seguir siendo deterministas primero:

- Un runner de escenarios que use proveedores simulados para afirmar llamadas a herramientas + orden, lecturas de archivos de skills y cableado de sesión.
- Un conjunto pequeño de escenarios enfocados en skills (usar frente a evitar, compuertas, inyección de prompts).
- Evaluaciones en vivo opcionales (opt-in, protegidas por env) solo después de que el conjunto seguro para CI esté listo.

## Pruebas de contrato (forma de plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
aserciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test` omite
intencionalmente estos archivos compartidos de seams y smoke; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, nombre, capacidades)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento de vinculación de sesión
- **outbound-payload** - Estructura de payload de mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Manejadores de acciones de canal
- **threading** - Manejo de ID de hilo
- **directory** - API de directorio/lista
- **group-policy** - Aplicación de política de grupo

### Contratos de estado de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de estado de canales
- **registry** - Forma del registro de plugins

### Contratos de proveedores

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API de catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Runtime de proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutar

- Después de cambiar exports o subpaths de plugin-sdk
- Después de añadir o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Añadir regresiones (guía)

Cuando arregles un problema de proveedor/modelo descubierto en vivo:

- Añade una regresión segura para CI si es posible (proveedor mock/stub, o captura la transformación exacta de la forma de la solicitud)
- Si es inherentemente solo en vivo (límites de tasa, políticas de autenticación), mantén la prueba en vivo acotada y opt-in mediante variables de entorno
- Prefiere apuntar a la capa más pequeña que detecte el bug:
  - bug de conversión/reproducción de solicitud de proveedor → prueba directa de modelos
  - bug de pipeline de sesión/historial/herramienta del gateway → prueba smoke en vivo del gateway o prueba mock del gateway segura para CI
- Barrera de protección de recorrido SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo muestreado por clase SecretRef desde los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego afirma que se rechazan los exec ids con segmentos de recorrido.
  - Si añades una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo sin clasificar para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
