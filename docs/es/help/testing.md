---
read_when:
    - Ejecución de pruebas de forma local o en CI
    - Adición de pruebas de regresión para errores de modelos/proveedores
    - Depuración del comportamiento del Gateway y del agente
summary: 'Kit de pruebas: conjuntos de pruebas unitarias, e2e y en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-07-11T23:09:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitarias/integración, e2e y en vivo), además de ejecutores de Docker. Esta página explica qué abarca cada suite, qué comando ejecutar para cada flujo de trabajo, cómo las pruebas en vivo detectan las credenciales y cómo añadir regresiones para errores reales de proveedores/modelos.

<Note>
**La pila de control de calidad (qa-lab, qa-channel y carriles de transporte en vivo)** se documenta por separado:

- [Descripción general de control de calidad](/es/concepts/qa-e2e-automation): arquitectura, superficie de comandos y creación de escenarios.
- [Control de calidad matricial](/es/concepts/qa-matrix): referencia para `pnpm openclaw qa matrix`.
- [Cuadro de madurez](/es/maturity/scorecard): cómo las evidencias de control de calidad de las versiones respaldan las decisiones sobre estabilidad y LTS.
- [Canal de control de calidad](/es/channels/qa-channel): el Plugin de transporte sintético utilizado por los escenarios respaldados por el repositorio.

Esta página abarca las suites de pruebas habituales y los ejecutores de Docker/Parallels. La sección [Ejecutores específicos de control de calidad](#qa-specific-runners) enumera a continuación las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Comprobación completa (prevista antes de enviar cambios): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos suficientes: `pnpm test:max`
- Bucle de observación directo de Vitest: `pnpm test:watch`
- La selección directa de archivos también enruta las rutas de plugins/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Al iterar sobre un único fallo, prioriza primero las ejecuciones específicas.
- Sitio de control de calidad respaldado por Docker: `pnpm qa:lab:up`
- Carril de control de calidad respaldado por una máquina virtual Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando modifiques pruebas o quieras mayor confianza:

- Informe informativo de cobertura de V8: `pnpm test:coverage`
- Suite e2e: `pnpm test:e2e`

## Directorios temporales de pruebas

Usa los asistentes compartidos de `test/helpers/temp-dir.ts` para los directorios temporales propiedad de las pruebas, de modo que la propiedad sea explícita y la limpieza permanezca dentro del ciclo de vida de la prueba:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` no expone intencionadamente ningún método de limpieza manual: Vitest se encarga de la limpieza después de cada prueba. Los asistentes anteriores de nivel inferior (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) siguen existiendo para las pruebas que aún no se han migrado; evita usarlos en código nuevo y evita nuevas llamadas directas a `fs.mkdtemp*`, salvo que una prueba verifique explícitamente el comportamiento básico de los directorios temporales. Cuando sea realmente necesario un directorio temporal directo, añade un comentario de autorización auditable con el motivo:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` informa sobre la creación de nuevos directorios temporales directos y sobre el nuevo uso manual de asistentes compartidos en las líneas añadidas del diff, sin bloquear los estilos de limpieza existentes. Sigue la misma clasificación de rutas de pruebas que `scripts/changed-lanes.mjs` y omite la propia implementación del asistente compartido. `check:changed` ejecuta este informe para las rutas de pruebas modificadas como una señal de CI que solo genera advertencias (anotaciones de advertencia de GitHub, no fallos).

## Flujos de trabajo en vivo y de Docker/Parallels

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos y sondeos de herramientas/imágenes del Gateway): `pnpm test:live`
- Ejecutar de forma silenciosa un único archivo en vivo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en tiempo de ejecución: ejecuta `OpenClaw Performance` con `live_openai_candidate=true` para un turno de agente real de `openai/gpt-5.6-luna` o con `deep_profile=true` para obtener artefactos de CPU/montículo/trazas de Kova. Las ejecuciones diarias programadas publican informes de los carriles del proveedor simulado, del perfil profundo y de GPT-5.6 Luna en `openclaw/clawgrit-reports` mediante una tarea de publicación independiente que consume artefactos; si la autenticación del publicador falta o no es válida, las ejecuciones programadas y las que usan `profile=release` fallan. Las ejecuciones manuales que no son de versión conservan los artefactos de GitHub y tratan la publicación de informes como orientativa. El informe del proveedor simulado también incluye cifras del arranque del Gateway a nivel de código fuente, memoria, presión de plugins, bucle repetido de saludo del modelo simulado y arranque de la CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ejecuta un turno de texto y un pequeño sondeo similar a una lectura de archivo. Los modelos cuyos metadatos anuncian entrada de `image` también ejecutan un pequeño turno con imagen. Desactiva los sondeos adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedores.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks`, que se ejecuta diariamente, como `OpenClaw Release Checks`, que se ejecuta manualmente, llaman al flujo de trabajo reutilizable en vivo/e2e con `include_live_suites: true`, lo que incluye tareas de la matriz de modelos en vivo de Docker divididas por proveedor.
  - Para repeticiones específicas en CI, ejecuta `OpenClaw Live And E2E Checks (Reusable)` con `include_live_suites: true` y `live_models_only: true`.
  - Añade nuevos secretos de proveedores con alta capacidad de señal a `scripts/ci-hydrate-live-auth.sh`, además de a `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y a sus invocadores programados/de versión.
- Prueba de humo nativa del chat vinculado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril en vivo de Docker en la ruta del servidor de aplicaciones de Codex, vincula un mensaje directo sintético de Slack con `/codex bind`, ejercita `/codex fast` y `/codex permissions` y, a continuación, verifica que una respuesta sencilla y un archivo adjunto de imagen se enruten mediante la vinculación nativa del Plugin en lugar de ACP.
- Prueba de humo del arnés del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente del Gateway mediante el arnés del servidor de aplicaciones de Codex propiedad del Plugin, verifica `/codex status` y `/codex models` y, de forma predeterminada, ejercita sondeos de imagen, MCP de Cron, subagente y Guardian. Desactiva el sondeo del subagente con `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos. Para una comprobación específica del subagente, desactiva los demás sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto termina después del sondeo del subagente, salvo que se establezca `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Prueba de humo de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala en Docker el archivo tar empaquetado de OpenClaw, ejecuta la configuración inicial con una clave de API de OpenAI y verifica que el Plugin de Codex y la dependencia `@openai/codex` se hayan descargado bajo demanda en la raíz administrada del proyecto npm.
- Prueba de humo en vivo de las dependencias de herramientas de plugins: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un Plugin de prueba con una dependencia real de `slugify`, lo instala mediante `npm-pack:`, verifica la dependencia en la raíz administrada del proyecto npm y, a continuación, solicita a un modelo en vivo de OpenAI que llame a la herramienta del Plugin y devuelva el identificador oculto.
- Prueba de humo del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional con redundancia adicional de la superficie del comando de rescate del canal de mensajes. Ejercita `/crestodian status`, pone en cola un cambio persistente de modelo, responde con `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Prueba de humo en Docker de la primera ejecución de Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado vacío de OpenClaw y primero demuestra que la CLI empaquetada `openclaw crestodian` falla de forma segura sin inferencia. Después prueba y activa un Claude simulado mediante el módulo de activación empaquetado. Solo entonces una solicitud aproximada de la CLI empaquetada llega al planificador y se resuelve como una configuración tipada, seguida de operaciones de una sola ejecución sobre el modelo, el agente, el Plugin de Discord y SecretRef. Valida la configuración y las entradas de auditoría. Esto aporta evidencias complementarias de las comprobaciones/operaciones, no demuestra una configuración inicial interactiva ni el agente, las herramientas o la aprobación de Crestodian. El mismo carril está disponible en QA Lab mediante `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Prueba de humo de costes de Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecuta `openclaw models list --provider moonshot --json` y, a continuación, ejecuta de forma aislada `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` con `moonshot/kimi-k2.6`. Verifica que el JSON indique Moonshot/K2.6 y que la transcripción del asistente almacene el valor normalizado de `usage.cost`.

<Tip>
Cuando solo necesites un caso que falla, prioriza acotar las pruebas en vivo mediante las variables de entorno de lista de permitidos descritas a continuación.
</Tip>

## Ejecutores específicos de control de calidad

Estos comandos complementan las suites de pruebas principales cuando necesitas el realismo de QA Lab.

CI ejecuta QA Lab en flujos de trabajo específicos. La paridad agéntica está incluida dentro de `QA-Lab - All Lanes` y de la validación de versiones, no en un flujo de trabajo independiente para PR. La validación amplia debe usar `Full Release Validation` con `rerun_group=qa-parity` o el grupo de control de calidad de las comprobaciones de versión. Las comprobaciones de versión estable/predeterminada mantienen las pruebas exhaustivas prolongadas en vivo/Docker tras `run_release_soak=true`; el perfil `full` las activa obligatoriamente. `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante ejecución manual, con el carril de paridad simulado, el carril Matrix en vivo, el carril de Telegram en vivo administrado por Convex y el carril de Discord en vivo administrado por Convex como tareas paralelas. Las ejecuciones programadas de control de calidad y las comprobaciones de versión pasan explícitamente `--profile fast` a Matrix, mientras que el valor predeterminado de la CLI de Matrix y de la entrada manual del flujo de trabajo sigue siendo `all`; la ejecución manual puede dividir `all` en tareas `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`. `OpenClaw Release Checks` ejecuta la paridad, además de los carriles rápidos de Matrix y Telegram, antes de aprobar una versión, y usa `mock-openai/gpt-5.6-luna` para las comprobaciones de transporte de la versión, de modo que sean deterministas y eviten el arranque habitual del Plugin del proveedor. Estos gateways de transporte en vivo desactivan la búsqueda en memoria; el comportamiento de la memoria sigue cubierto por las suites de paridad de control de calidad.

Las particiones de medios en vivo de la versión completa usan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya incluye `ffmpeg` y `ffprobe`. Las particiones de modelos/backends en vivo de Docker usan la imagen compartida `ghcr.io/openclaw/openclaw-live-test:<sha>`, que se compila una vez por cada confirmación seleccionada y después se descarga con `OPENCLAW_SKIP_DOCKER_BUILD=1`, en lugar de volver a compilarla dentro de cada partición.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Escribe los artefactos de nivel superior `qa-evidence.json`, `qa-suite-summary.json` y
    `qa-suite-report.md` para el conjunto de escenarios seleccionado, incluidas
    selecciones de escenarios de flujo mixto, Vitest y Playwright.
  - Cuando se inicia mediante `pnpm openclaw qa run --qa-profile <profile>`, incorpora
    la tabla de puntuación del perfil taxonómico seleccionado en el mismo `qa-evidence.json`.
    `smoke-ci` escribe evidencia reducida (`evidenceMode: "slim"`, sin `execution`
    por entrada). `release` abarca el subconjunto seleccionado de preparación para
    lanzamientos; `all` selecciona todas las categorías de madurez activas y está
    destinado a ejecuciones explícitas del flujo de trabajo de evidencia del perfil
    de QA cuando se necesita un artefacto con la tabla de puntuación completa.
  - De forma predeterminada, ejecuta varios escenarios seleccionados en paralelo con
    procesos de trabajo de Gateway aislados. `qa-channel` usa de forma predeterminada
    una concurrencia de 4 (limitada por la cantidad de escenarios seleccionados).
    Usa `--concurrency <count>` para ajustar la cantidad de procesos de trabajo o
    `--concurrency 1` para la vía serial anterior.
  - Finaliza con un código distinto de cero cuando falla algún escenario. Usa
    `--allow-failures` para generar artefactos sin un código de salida de error.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para ofrecer
    cobertura experimental de fixtures y simulaciones de protocolo sin reemplazar
    la vía `mock-openai`, que tiene en cuenta los escenarios.
- `pnpm openclaw qa coverage --match <query>`
  - Busca en identificadores y títulos de escenarios, superficies, identificadores
    de cobertura, referencias de documentación, referencias de código, plugins y
    requisitos de proveedores; después muestra los destinos de suite coincidentes.
  - Úsalo antes de una ejecución de QA Lab cuando conozcas el comportamiento o la
    ruta de archivo afectados, pero no el escenario más pequeño. Es solo orientativo:
    debes seguir eligiendo pruebas simuladas, en vivo, de Multipass, de Matrix o de
    transporte según el comportamiento que se esté modificando.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta la batería en vivo del Plugin Kitchen Sink de OpenAI mediante QA Lab.
    Instala el paquete externo Kitchen Sink, verifica el inventario de superficies
    del SDK de plugins, sondea `/healthz` y `/readyz`, registra evidencia de CPU/RSS
    del Gateway, ejecuta un turno en vivo de OpenAI y comprueba diagnósticos
    adversariales. Requiere autenticación en vivo de OpenAI, como `OPENAI_API_KEY`.
    En sesiones de Testbox preparadas, carga automáticamente el perfil de
    autenticación en vivo de Testbox cuando está disponible el auxiliar
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta la prueba comparativa de inicio del Gateway junto con un pequeño paquete
    de escenarios simulados de QA Lab (`channel-chat-baseline`,
    `memory-failure-fallback`, `gateway-restart-inflight-run`) y escribe un resumen
    combinado de observaciones de CPU en `.artifacts/gateway-cpu-scenarios/`.
  - De forma predeterminada, solo marca las observaciones sostenidas de CPU elevada
    (`--cpu-core-warn`, valor predeterminado `0.9`; `--hot-wall-warn-ms`, valor
    predeterminado `30000`), por lo que los picos breves durante el inicio se
    registran como métricas sin parecerse a la regresión que mantiene el Gateway
    saturado durante varios minutos.
  - Se ejecuta con los artefactos compilados de `dist`; ejecuta primero una compilación
    cuando el checkout aún no tenga una salida reciente del entorno de ejecución.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una máquina virtual Linux desechable de
    Multipass, manteniendo los mismos indicadores de selección de escenarios,
    proveedor y modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA que resultan
    prácticas para el sistema invitado: claves de proveedor basadas en variables de
    entorno, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME`
    cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que
    el sistema invitado pueda escribir en ellos mediante el espacio de trabajo montado.
  - Escribe el informe y el resumen normales de QA, además de los registros de
    Multipass, en `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para tareas de QA orientadas a operadores.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Genera un tarball de npm a partir del checkout actual, lo instala globalmente en
    Docker, ejecuta la incorporación no interactiva mediante una clave de API de
    OpenAI, configura Telegram de forma predeterminada, verifica que el entorno de
    ejecución del Plugin empaquetado se cargue sin reparar dependencias durante el
    inicio, ejecuta doctor y realiza un turno de agente local contra un endpoint
    simulado de OpenAI.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma vía de instalación
    empaquetada con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta una prueba de humo determinista de la aplicación compilada en Docker para
    transcripciones con contexto de entorno de ejecución integrado. Verifica que el
    contexto oculto del entorno de ejecución de OpenClaw persista como un mensaje
    personalizado no visible, en lugar de filtrarse al turno visible del usuario;
    después prepara un archivo JSONL de sesión defectuoso afectado y verifica que
    `openclaw doctor --fix` lo reescriba en la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete candidato de OpenClaw en Docker, ejecuta la incorporación del
    paquete instalado, configura Telegram mediante la CLI instalada y después reutiliza
    la vía de QA en vivo de Telegram con ese paquete instalado como Gateway del sistema
    sometido a prueba.
  - El contenedor auxiliar solo monta desde el checkout el código fuente del arnés
    `qa-lab`; el paquete instalado controla `dist`, `openclaw/plugin-sdk` y el entorno
    de ejecución del Plugin incluido, por lo que la vía no mezcla plugins del checkout
    actual con el paquete sometido a prueba.
  - El valor predeterminado es
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; establece
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar de
    instalarlo desde el registro.
  - De forma predeterminada, emite mediciones repetidas de RTT en `qa-evidence.json`
    con `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescribe
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la ejecución.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` acepta una lista separada por comas de
    identificadores de comprobaciones de QA de Telegram que se deben muestrear;
    cuando no se establece, la comprobación predeterminada compatible con RTT es
    `telegram-mentioned-message-reply`.
  - Usa las mismas credenciales de Telegram mediante variables de entorno o la misma
    fuente de credenciales de Convex que `pnpm openclaw qa telegram`. Para la
    automatización de CI o lanzamientos, establece
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` junto con
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en CI,
    el contenedor auxiliar de Docker selecciona Convex automáticamente.
  - El contenedor auxiliar valida en el host las variables de entorno de credenciales
    de Telegram o Convex antes de las tareas de compilación e instalación de Docker.
    Establece `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` únicamente cuando
    estés depurando deliberadamente la configuración previa a las credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartido solo para esta vía. Cuando se seleccionan
    credenciales de Convex y no se establece ningún rol, el contenedor auxiliar usa
    `ci` dentro de CI y `maintainer` fuera de CI.
  - GitHub Actions expone esta vía como el flujo de trabajo manual para mantenedores
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el
    entorno `qa-live-shared` y concesiones de credenciales de CI de Convex.
- GitHub Actions también expone `Package Acceptance` para realizar pruebas de producto
  complementarias con un paquete candidato. Acepta una referencia de Git, una
  especificación npm publicada, una URL HTTPS de tarball junto con su SHA-256, una
  política de URL de confianza o un artefacto tarball procedente de otra ejecución
  (`source=ref|npm|url|trusted-url|artifact`); carga el archivo normalizado
  `openclaw-current.tgz` como `package-under-test` y después ejecuta el planificador
  existente de pruebas E2E de Docker con los perfiles de vía `smoke`, `package`,
  `product`, `full` o `custom`. Establece `telegram_mode=mock-openai` o
  `live-frontier` para ejecutar el flujo de trabajo de QA de Telegram con el mismo
  artefacto `package-under-test`.
  - Prueba del producto con la versión beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba con una URL exacta de tarball requiere un resumen y usa la política de
  seguridad para URL públicas:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Los espejos empresariales o privados de tarballs usan una política explícita de
  fuente de confianza:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lee `.github/package-trusted-sources.json` desde la referencia
de confianza del flujo de trabajo y no acepta credenciales en la URL ni una omisión
de la red privada proporcionada mediante una entrada del flujo de trabajo. Si la
política indicada declara autenticación mediante token de portador, configura el
secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prueba mediante artefacto descarga un artefacto tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el Gateway
    con OpenAI configurado y después habilita los canales/plugins incluidos mediante
    modificaciones de configuración.
  - Verifica que la detección durante la configuración inicial deje ausentes los
    plugins descargables no configurados, que la primera reparación configurada de
    doctor instale explícitamente cada Plugin descargable que falte y que un segundo
    reinicio no ejecute una reparación oculta de dependencias.
  - También instala una versión de referencia npm anterior conocida, habilita Telegram
    antes de ejecutar `openclaw update --tag <candidate>` y verifica que doctor,
    después de actualizar al candidato, elimine los residuos de dependencias de
    plugins heredadas sin una reparación posterior a la instalación realizada por
    el arnés.
- `pnpm test:parallels:npm-update`
  - Ejecuta la prueba de humo nativa de actualización de la instalación empaquetada en
    los sistemas invitados de Parallels. Cada plataforma seleccionada instala primero
    el paquete de referencia solicitado, después ejecuta el comando instalado
    `openclaw update` en el mismo sistema invitado y verifica la versión instalada, el
    estado de la actualización, la disponibilidad del Gateway y un turno de agente local.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mientras iteras
    sobre un sistema invitado. Usa `--json` para obtener la ruta del artefacto de
    resumen y el estado de cada vía.
  - La vía de OpenAI usa `openai/gpt-5.6-luna` de forma predeterminada para la prueba
    del turno de agente en vivo. Pasa `--model <provider/model>` o establece
    `OPENCLAW_PARALLELS_OPENAI_MODEL` para validar otro modelo de OpenAI.
  - Encapsula las ejecuciones locales prolongadas en un tiempo de espera del host para
    que los bloqueos del transporte de Parallels no consuman el resto del período de
    pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros anidados de las vías en
    `/tmp/openclaw-parallels-npm-update.*`. Inspecciona `windows-update.log`,
    `macos-update.log` o `linux-update.log` antes de asumir que el contenedor auxiliar
    externo está bloqueado.
  - La actualización de Windows puede tardar entre 10 y 15 minutos en las tareas de
    doctor posteriores a la actualización y en la actualización del paquete en un
    sistema invitado en frío; el proceso sigue siendo correcto mientras avance el
    registro de depuración anidado de npm.
  - No ejecutes este contenedor auxiliar agregado en paralelo con las vías individuales
    de prueba de humo de Parallels para macOS, Windows o Linux. Comparten el estado de
    la máquina virtual y pueden entrar en conflicto durante la restauración de
    instantáneas, la publicación de paquetes o el estado del Gateway del sistema invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins
    incluidos porque las fachadas de capacidades, como voz, generación de imágenes y
    comprensión multimedia, se cargan mediante las API del entorno de ejecución
    incluido, aunque el propio turno del agente solo compruebe una respuesta de texto
    sencilla.

- `pnpm openclaw qa aimock`
  - Inicia únicamente el servidor local del proveedor AIMock para realizar
    pruebas rápidas directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta el carril de QA en vivo de Matrix contra un homeserver Tuwunel
    desechable respaldado por Docker. Solo está disponible desde el código
    fuente; las instalaciones empaquetadas no incluyen `qa-lab`.
  - CLI completa, catálogo de perfiles y escenarios, variables de entorno y
    estructura de artefactos:
    [QA de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta el carril de QA en vivo de Telegram contra un grupo privado real
    usando los tokens del bot controlador y del bot del SUT proporcionados
    mediante variables de entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id. del grupo debe ser el id.
    numérico del chat de Telegram.
  - Admite `--credential-source convex` para usar credenciales compartidas
    de un grupo común. Usa de forma predeterminada el modo de variables de
    entorno o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para habilitar
    los arrendamientos del grupo común.
  - Los valores predeterminados cubren la prueba canario, el control por
    menciones, el direccionamiento de comandos, `/status`, las respuestas
    mencionadas entre bots y las respuestas de comandos nativos del núcleo.
    Los valores predeterminados de `mock-openai` también cubren regresiones
    deterministas de cadenas de respuestas y de transmisión del mensaje
    final de Telegram. Usa `--list-scenarios` para consultar pruebas
    opcionales como `session_status`.
  - Finaliza con un código distinto de cero si falla algún escenario. Usa
    `--allow-failures` para generar artefactos sin un código de salida de
    error.
  - Requiere dos bots distintos en el mismo grupo privado y que el bot del
    SUT tenga un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilita Bot-to-Bot Communication Mode
    en `@BotFather` para ambos bots y asegúrate de que el bot controlador
    pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y `qa-evidence.json` en
    `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen el RTT
    desde la solicitud de envío del controlador hasta la respuesta observada
    del SUT.

`Mantis Telegram Live` es el contenedor de evidencias para PR de este carril.
Ejecuta la referencia candidata con credenciales de Telegram arrendadas
mediante Convex, representa el paquete redactado de informe y evidencias de
QA en un navegador de escritorio de Crabbox, graba evidencias en MP4, genera
un GIF recortado según el movimiento, carga el paquete de artefactos y
publica evidencias insertadas en el PR mediante la aplicación de GitHub
Mantis cuando se establece `pr_number`. Los mantenedores pueden iniciarlo
desde la interfaz de Actions mediante `Mantis Scenario` (`scenario_id:
telegram-live`) o directamente desde un comentario de una solicitud de
incorporación:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` es el contenedor agéntico anterior/posterior
de la aplicación nativa Telegram Desktop para obtener pruebas visuales de
PR. Inícialo desde la interfaz de Actions con `instructions` de formato
libre, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) o desde un comentario de PR:

```text
@openclaw-mantis telegram desktop proof
```

El agente Mantis lee el PR, determina qué comportamiento visible en Telegram
demuestra el cambio, ejecuta el carril de pruebas de Telegram Desktop para
usuarios reales de Crabbox en las referencias de base y candidata, itera
hasta que los GIF nativos resulten útiles, escribe un manifiesto
`motionPreview` emparejado y publica la misma tabla de GIF de 2 columnas
mediante la aplicación de GitHub Mantis cuando se establece `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Arrienda o reutiliza un escritorio Linux de Crabbox, instala la
    aplicación nativa Telegram Desktop, configura OpenClaw con un token
    arrendado para el bot de Telegram del SUT, inicia el Gateway y graba
    evidencias en capturas de pantalla y MP4 desde el escritorio VNC visible.
  - El valor predeterminado es `--credential-source convex`, por lo que los
    flujos de trabajo solo necesitan el secreto del intermediario Convex.
    Usa `--credential-source env` con las mismas variables
    `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop sigue necesitando un inicio de sesión o perfil de
    usuario. El token del bot configura únicamente OpenClaw. Usa
    `--telegram-profile-archive-env <name>` para proporcionar un archivo de
    perfil `.tgz` en base64, o usa `--keep-lease` e inicia sesión manualmente
    una vez mediante VNC.
  - Escribe `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4`
    en el directorio de salida.

Los carriles de transporte en vivo comparten un contrato estándar para
evitar que los nuevos transportes se desvíen; la matriz de cobertura de cada
carril se encuentra en
[Resumen de QA: cobertura de transportes en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` es el conjunto sintético amplio y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando se habilita `--credential-source convex` (o
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) para la QA de transportes en vivo, el
laboratorio de QA adquiere un arrendamiento exclusivo de un grupo respaldado
por Convex, envía Heartbeat para ese arrendamiento mientras se ejecuta el
carril y libera el arrendamiento al cerrarse. El nombre de la sección es
anterior a la compatibilidad con Discord, Slack y WhatsApp; el contrato de
arrendamiento se comparte entre los distintos tipos.

Estructura de referencia del proyecto Convex: `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo, `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado del entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (de forma predeterminada, `ci` en CI y `maintainer` en los demás casos)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valor predeterminado: `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valor predeterminado: `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valor predeterminado: `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valor predeterminado: `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valor predeterminado: `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id. de seguimiento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite direcciones URL Convex de local loopback con `http://` exclusivamente para desarrollo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` durante el funcionamiento normal.

Los comandos administrativos de los mantenedores (añadir, eliminar y
enumerar elementos del grupo) requieren específicamente
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Utilidades de la CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` antes de las ejecuciones en vivo para comprobar la dirección
URL del sitio Convex, los secretos del intermediario, el prefijo del punto
de conexión, el tiempo de espera HTTP y el acceso administrativo y de
enumeración sin imprimir los valores secretos. Usa `--json` para obtener una
salida legible por máquinas en scripts y utilidades de CI.

Contrato predeterminado del punto de conexión
(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Las solicitudes se autentican con un encabezado
`Authorization: Bearer <role secret>`; los cuerpos siguientes omiten dicho
encabezado:

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
- `POST /admin/add` (solo con el secreto del mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo con el secreto del mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección contra arrendamientos activos: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo con el secreto del mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Estructura de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena con el id. numérico de un chat de Telegram.
- `admin/add` valida esta estructura para `kind: "telegram"` y rechaza las cargas útiles con formato incorrecto.

Estructura de la carga útil para el tipo de usuario real de Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` está reservado para el flujo de trabajo de pruebas de Telegram Desktop de Mantis. Los carriles genéricos del laboratorio de QA no deben adquirirlo.

Cargas útiles multicanal validadas por el intermediario:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Los carriles de Slack también pueden arrendar credenciales del grupo, pero la
validación de la carga útil de Slack se encuentra actualmente en el ejecutor
de QA de Slack, no en el intermediario. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para las filas de Slack.

### Añadir un canal a QA

La arquitectura y los nombres de las utilidades de escenarios para los
adaptadores de canales nuevos se encuentran en
[Resumen de QA: añadir un canal](/es/concepts/qa-e2e-automation#adding-a-channel).
Los requisitos mínimos son: implementar el ejecutor del transporte en la
interfaz compartida del host `qa-lab`, añadir un `adapterFactory` para los
escenarios compartidos, declarar `qaRunners` en el manifiesto del Plugin,
montarlo como `openclaw qa <runner>` y crear escenarios en `qa/scenarios/`.

## Conjuntos de pruebas (qué se ejecuta y dónde)

Considera los conjuntos como niveles de «realismo creciente» (y también de
inestabilidad y coste crecientes).

### Pruebas unitarias y de integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin destino específico usan el conjunto de
  particiones `vitest.full-*.config.ts` y pueden expandir las particiones
  multiproyecto en configuraciones por proyecto para su programación en
  paralelo
- Archivos: inventarios de pruebas del núcleo y unitarias en
  `src/**/*.test.ts`, `packages/**/*.test.ts` y `test/**/*.test.ts`; las
  pruebas unitarias de la interfaz de usuario se ejecutan en la partición
  dedicada `unit-ui`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración dentro del proceso (autenticación del Gateway, enrutamiento, herramientas, análisis sintáctico y configuración)
  - Regresiones deterministas de errores conocidos
- Expectativas:
  - Se ejecutan en CI
  - No requieren claves reales
  - Deben ser rápidas y estables
  - Las pruebas del solucionador y del cargador de superficies públicas deben
    demostrar el comportamiento general de reserva de `api.js` y
    `runtime-api.js` mediante pequeños accesorios de Plugin generados, no
    mediante las API del código fuente de Plugins incluidos reales. Las
    cargas de API de Plugins reales pertenecen a conjuntos de
    contratos/integración propiedad del Plugin.

Política de dependencias nativas:

- Las instalaciones de pruebas predeterminadas omiten las compilaciones
  nativas opcionales de Opus para Discord. La voz de Discord usa el
  `libopus-wasm` incluido y `@discordjs/opus` permanece deshabilitado en
  `allowBuilds` para que las pruebas locales y los carriles de Testbox no
  compilen el complemento nativo.
- Compara el rendimiento del Opus nativo en el repositorio de pruebas de
  rendimiento de `libopus-wasm`, no en los ciclos predeterminados de
  instalación y pruebas de OpenClaw. No establezcas `@discordjs/opus` en
  `true` dentro de `allowBuilds` de forma predeterminada; eso provoca que
  ciclos de instalación y pruebas no relacionados compilen código nativo.

<AccordionGroup>
  <Accordion title="Proyectos, particiones y carriles con alcance limitado">

    - Las ejecuciones no dirigidas de `pnpm test` ejecutan trece configuraciones de fragmentos más pequeños (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigantesco del proyecto raíz. Esto reduce el pico de RSS en máquinas con carga y evita que el trabajo de respuesta automática o de plugins deje sin recursos a conjuntos de pruebas no relacionados.
    - `pnpm test --watch` sigue usando el grafo de proyectos nativo de `vitest.config.ts` en la raíz, porque un bucle de observación con múltiples fragmentos no resulta práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` dirigen primero los objetivos explícitos de archivos o directorios mediante carriles de ámbito limitado, de modo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el coste de inicio de todo el proyecto raíz.
    - De forma predeterminada, `pnpm test:changed` expande las rutas de Git modificadas en carriles económicos de ámbito limitado: modificaciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y dependientes locales del grafo de importaciones. Las modificaciones de configuración, preparación o paquetes no ejecutan pruebas de forma amplia, salvo que se use explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta de comprobación local inteligente habitual para trabajos acotados. Clasifica el diff en núcleo, pruebas del núcleo, extensiones, pruebas de extensiones, aplicaciones, documentación, metadatos de lanzamiento, herramientas de Docker en vivo y herramientas generales; después ejecuta los comandos correspondientes de comprobación de tipos, lint y protección. No ejecuta pruebas de Vitest; para demostrar el funcionamiento mediante pruebas, invoque `pnpm test:changed` o un `pnpm test <target>` explícito. Los incrementos de versión que solo afectan a metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión, configuración y dependencias raíz, con una protección que rechaza cambios de paquetes fuera del campo de versión de nivel superior.
    - Las modificaciones del arnés ACP de Docker en vivo ejecutan comprobaciones específicas: sintaxis del shell para los scripts de autenticación de Docker en vivo y una ejecución de prueba del planificador de Docker en vivo. Los cambios en `package.json` solo se incluyen cuando el diff se limita a `scripts["test:docker:live-*"]`; los cambios de dependencias, exportaciones, versiones y otras superficies del paquete siguen usando las protecciones más amplias.
    - Las pruebas unitarias con pocas importaciones de agentes, comandos, plugins, auxiliares de respuesta automática, `plugin-sdk` y áreas similares de utilidades puras se dirigen mediante el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o con un uso intensivo del entorno de ejecución permanecen en los carriles existentes.
    - Determinados archivos fuente auxiliares de `plugin-sdk` y `commands` también asignan las ejecuciones en modo de cambios a pruebas hermanas explícitas en esos carriles ligeros, por lo que las modificaciones de auxiliares evitan volver a ejecutar todo el conjunto pesado de ese directorio.
    - `auto-reply` dispone de grupos específicos para los auxiliares principales de nivel superior, las pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. La CI divide además el subárbol de respuestas en fragmentos de ejecución de agentes, despacho y enrutamiento de comandos/estado, para evitar que un único grupo con muchas importaciones acapare toda la cola de Node.
    - La CI normal de PR y de la rama principal omite deliberadamente el barrido por lotes de plugins incluidos y el fragmento `agentic-plugins`, reservado para lanzamientos. La Validación Completa de Lanzamiento inicia el flujo de trabajo secundario independiente `Plugin Prerelease` para esos conjuntos con gran carga de plugins en los candidatos a lanzamiento.

  </Accordion>

  <Accordion title="Cobertura del ejecutor integrado">

    - Cuando cambie las entradas de descubrimiento de herramientas de mensajes o el contexto del entorno de ejecución de Compaction,
      conserve ambos niveles de cobertura.
    - Añada regresiones específicas de auxiliares para los límites puros de enrutamiento y normalización.
    - Mantenga en buen estado los conjuntos de integración del ejecutor integrado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` y
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Esos conjuntos verifican que los identificadores con ámbito y el comportamiento de Compaction sigan fluyendo
      por las rutas reales de `run.ts` / `compact.ts`; las pruebas limitadas a auxiliares
      no sustituyen adecuadamente esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados del grupo y aislamiento de Vitest">

    - La configuración base de Vitest usa `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y utiliza el
      ejecutor sin aislamiento en los proyectos raíz y en las configuraciones de extremo a extremo y en vivo.
    - El carril de interfaz de usuario raíz conserva su configuración de `jsdom` y su optimizador, pero también se ejecuta con el
      ejecutor compartido sin aislamiento.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados de `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` de forma predeterminada a los procesos secundarios de Node
      de Vitest para reducir la actividad repetida de compilación de V8 durante ejecuciones locales grandes.
      Establezca `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento estándar de V8.
    - `scripts/run-vitest.mjs` finaliza las ejecuciones explícitas de Vitest sin observación
      tras 5 minutos sin salida estándar ni salida de error. Establezca
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desactivar el supervisor durante
      una investigación intencionadamente silenciosa.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook previo al commit solo aplica formato. Vuelve a preparar los archivos formateados
      y no ejecuta lint, comprobaciones de tipos ni pruebas.
    - Ejecute `pnpm check:changed` explícitamente antes de entregar o enviar los cambios cuando
      necesite la puerta de comprobación local inteligente.
    - De forma predeterminada, `pnpm test:changed` se dirige mediante carriles económicos de ámbito limitado. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el agente
      determine que una modificación del arnés, la configuración, el paquete o el contrato realmente necesita
      una cobertura de Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
      pero con un límite superior de procesos de trabajo.
    - El escalado automático de procesos de trabajo locales es deliberadamente conservador y se reduce
      cuando la carga media del host ya es alta, para que varias ejecuciones simultáneas
      de Vitest causen menos perjuicios de forma predeterminada.
    - La configuración base de Vitest marca los proyectos y archivos de configuración como
      `forceRerunTriggers`, de modo que las repeticiones de ejecución en modo de cambios sigan siendo correctas cuando cambia
      el cableado de las pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en
      los hosts compatibles; establezca `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      para usar una ubicación de caché explícita para la elaboración directa de perfiles.

  </Accordion>

  <Accordion title="Depuración del rendimiento">

    - `pnpm test:perf:imports` habilita los informes de duración de las importaciones de Vitest junto con
      el desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de elaboración de perfiles a
      los archivos modificados desde `origin/main`.
    - Los datos temporales de los fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de configuraciones completas usan la ruta de configuración como clave; los fragmentos de CI
      con patrones de inclusión añaden el nombre del fragmento para poder realizar el seguimiento
      por separado de los fragmentos filtrados.
    - Cuando una prueba con alta carga aún dedica la mayor parte del tiempo a las importaciones iniciales,
      mantenga las dependencias pesadas tras una interfaz local y acotada `*.runtime.ts` y
      simule directamente esa interfaz, en lugar de importar profundamente auxiliares del entorno de ejecución
      solo para pasarlos mediante `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado con la ruta nativa del proyecto raíz para ese
      diff confirmado e imprime el tiempo transcurrido y el RSS máximo en macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el rendimiento del árbol de trabajo
      actual con cambios, dirigiendo la lista de archivos modificados mediante
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      los costes de inicio y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU y memoria dinámica del ejecutor para
      el conjunto unitario con el paralelismo de archivos deshabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidad (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` y `test/vitest/vitest.infra.config.ts`, cada una forzada a un proceso de trabajo
- Ámbito:
  - Inicia un Gateway real de local loopback con los diagnósticos habilitados de forma predeterminada
  - Genera actividad sintética de mensajes, memoria y cargas útiles grandes del Gateway mediante la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC de WebSocket del Gateway
  - Cubre los auxiliares de persistencia del paquete de estabilidad de diagnóstico
  - Comprueba que el registrador permanezca acotado, que las muestras sintéticas de RSS se mantengan por debajo del presupuesto de presión y que las profundidades de las colas por sesión vuelvan a cero
- Expectativas:
  - Apto para CI y sin claves
  - Carril acotado para el seguimiento de regresiones de estabilidad, no un sustituto del conjunto completo del Gateway

### E2E (agregado del repositorio)

- Comando: `pnpm test:e2e`
- Ámbito:
  - Ejecuta el carril E2E de prueba de humo del Gateway
  - Ejecuta el carril E2E de navegador de la interfaz de control con simulaciones
- Expectativas:
  - Apto para CI y sin claves
  - Requiere que Chromium de Playwright esté instalado

### E2E (prueba de humo del Gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuración: `test/vitest/vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y las pruebas E2E de plugins incluidos en `extensions/`
- Valores predeterminados del entorno de ejecución:
  - Usa `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Usa procesos de trabajo adaptativos (CI: hasta 2; local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir el coste de E/S de la consola.
- Modificaciones útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de procesos de trabajo (con un límite de 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de la consola.
- Ámbito:
  - Comportamiento integral del Gateway con varias instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y operaciones de red más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No requiere claves reales
  - Tiene más componentes móviles que las pruebas unitarias (puede ser más lento)

### E2E (navegador simulado de la interfaz de control)

- Comando: `pnpm test:ui:e2e`
- Configuración: `test/vitest/vitest.ui-e2e.config.ts`
- Archivos: `ui/src/**/*.e2e.test.ts`
- Ámbito:
  - Inicia la interfaz de control de Vite
  - Controla una página real de Chromium mediante Playwright
  - Sustituye el WebSocket del Gateway por simulaciones deterministas dentro del navegador
- Expectativas:
  - Se ejecuta en CI como parte de `pnpm test:e2e`
  - No requiere un Gateway real, agentes ni claves de proveedores
  - La dependencia del navegador debe estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: prueba de humo del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Ámbito:
  - Reutiliza un Gateway local activo de OpenShell
  - Crea un entorno aislado a partir de un Dockerfile local temporal
  - Ejercita el backend de OpenShell de OpenClaw mediante un `sandbox ssh-config` real y la ejecución por SSH
  - Verifica el comportamiento del sistema de archivos canónico remoto mediante el puente de sistema de archivos del entorno aislado
- Expectativas:
  - Solo mediante activación explícita; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI `openshell` local y un daemon de Docker operativo
  - Requiere un Gateway local activo de OpenShell y su fuente de configuración
  - Usa valores aislados de `HOME` / `XDG_CONFIG_HOME` y después destruye el entorno aislado de prueba
- Modificaciones útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente el conjunto E2E más amplio
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para señalar un binario de CLI o script contenedor no predeterminado
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para exponer la configuración registrada del Gateway a la prueba aislada
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para sustituir la IP del Gateway de Docker que utiliza el accesorio de política del host

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `test/vitest/vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos en `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - «¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?»
  - Detectar cambios en el formato del proveedor, particularidades de las llamadas a herramientas, problemas de autenticación y comportamiento de los límites de frecuencia
- Expectativas:
  - Por diseño, no es estable en CI (redes reales, políticas reales de los proveedores, cuotas, interrupciones)
  - Cuesta dinero o consume límites de frecuencia
  - Es preferible ejecutar subconjuntos acotados en lugar de «todo»
- Las ejecuciones en vivo usan claves de API ya exportadas y perfiles de autenticación preparados.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian el material de configuración/autenticación en un directorio personal temporal de pruebas, para que los recursos de pruebas unitarias no puedan modificar el directorio real `~/.openclaw`.
- Establezca `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesite deliberadamente que las pruebas en vivo usen su directorio personal real.
- `pnpm test:live` usa de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...` y silencia los registros de arranque del Gateway y los mensajes de Bonjour. Establezca `OPENCLAW_LIVE_TEST_QUIET=0` si desea recuperar todos los registros de inicio.
- Rotación de claves de API (específica del proveedor): establezca `*_API_KEYS` con formato separado por comas o punto y coma, o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), o una sobrescritura por ejecución en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas vuelven a intentarlo cuando reciben respuestas de límite de frecuencia.
- Salida de progreso/Heartbeat:
  - Los conjuntos de pruebas en vivo emiten líneas de progreso en stderr, para que las llamadas prolongadas a proveedores muestren actividad incluso cuando la captura de consola de Vitest está en silencio.
  - `test/vitest/vitest.live.config.ts` deshabilita la interceptación de consola de Vitest, para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajuste los Heartbeat de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste los Heartbeat del Gateway/sondeo con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué conjunto de pruebas debo ejecutar?

Use esta tabla de decisiones:

- Al editar lógica/pruebas: ejecute `pnpm test` (y `pnpm test:coverage` si cambió muchas cosas)
- Al modificar la red del Gateway, el protocolo WS o el emparejamiento: añada `pnpm test:e2e`
- Al depurar «mi bot no funciona», fallos específicos de un proveedor o llamadas a herramientas: ejecute un `pnpm test:live` acotado

## Pruebas en vivo (con acceso a la red)

Para la matriz de modelos en vivo, las pruebas rápidas de backends de CLI, las pruebas rápidas de ACP, el entorno de pruebas del servidor de aplicaciones de Codex y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen, música, vídeo y entorno multimedia), además de la gestión de credenciales para ejecuciones en vivo:

- consulte [Pruebas de conjuntos en vivo](/es/help/testing-live). Para la lista de comprobación específica de actualizaciones y validación de plugins, consulte
  [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores de Docker (comprobaciones opcionales de «funciona en Linux»)

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan únicamente el archivo en vivo correspondiente a sus claves de perfil dentro de la imagen de Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando el directorio de configuración local, el espacio de trabajo y el archivo opcional de variables de entorno del perfil. Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores en vivo de Docker mantienen sus propios límites prácticos cuando es necesario:
  `test:docker:live-models` usa de forma predeterminada el conjunto seleccionado de alta señal compatible, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Establezca `OPENCLAW_LIVE_MAX_MODELS`
  o las variables de entorno del Gateway cuando desee explícitamente un límite menor o un análisis más amplio.
- `test:docker:all` compila una vez la imagen de Docker en vivo mediante `test:docker:live-build`, empaqueta OpenClaw una vez como archivo tar de npm mediante `scripts/package-openclaw-for-docker.mjs` y, después, compila/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es únicamente el ejecutor de Node/Git para las vías de instalación, actualización y dependencias de plugins; esas vías montan el archivo tar precompilado. La imagen funcional instala el mismo archivo tar en `/app` para las vías de funcionalidad de la aplicación compilada. Las definiciones de vías de Docker se encuentran en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica de planificación se encuentra en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El conjunto usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de procesos, mientras que los límites de recursos evitan que todas las vías pesadas —en vivo, de instalación de npm y de varios servicios— se inicien a la vez. Si una sola vía es más pesada que los límites activos, el planificador puede iniciarla cuando el grupo está vacío y mantenerla en ejecución de forma exclusiva hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (y otras sobrescrituras `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) solo cuando el host de Docker tenga más capacidad disponible. De forma predeterminada, el ejecutor realiza una comprobación previa de Docker, elimina los contenedores E2E obsoletos de OpenClaw, imprime el estado cada 30 segundos, almacena los tiempos de las vías correctas en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero las vías más largas en ejecuciones posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de vías sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de las vías seleccionadas, las necesidades de paquetes/imágenes y las credenciales.
- `Package Acceptance` es la validación de paquetes nativa de GitHub para «¿funciona como producto este archivo tar instalable?». Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url`, `source=trusted-url` o `source=artifact`, lo carga como `package-under-test` y, después, ejecuta las vías E2E reutilizables de Docker con ese archivo tar exacto, en lugar de volver a empaquetar la referencia seleccionada. Los perfiles se ordenan por amplitud: `smoke`, `package`, `product` y `full` (además de `custom` para una lista explícita de vías). Consulte [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins) para conocer el contrato de paquetes/actualizaciones/plugins, la matriz de supervivencia de actualizaciones publicadas, los valores predeterminados de las versiones y la clasificación de fallos.
- Las comprobaciones de compilación y publicación ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js`, y falla si ese grafo de arranque previo al despacho importa estáticamente cualquier paquete externo (Commander, interfaces de solicitud, undici, registro y dependencias similares que sobrecarguen el inicio cuentan) antes del despacho del comando; también limita a 70 KB el fragmento de ejecución incluido del Gateway y rechaza las importaciones estáticas de rutas frías conocidas del Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) desde ese fragmento. Por separado, `scripts/release-check.ts` realiza pruebas rápidas de la CLI empaquetada con `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` y `models list --provider openai`.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (incluido `2026.4.25-beta.*`). Hasta ese límite, el entorno de pruebas tolera únicamente deficiencias de metadatos de paquetes publicados: entradas omitidas del inventario privado de control de calidad, ausencia de `gateway install --wrapper`, archivos de parche ausentes en el recurso de Git derivado del archivo tar, ausencia de `update.channel` persistente, ubicaciones heredadas de registros de instalación de plugins, ausencia de persistencia de registros de instalación del catálogo y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas producen fallos estrictos.
- Ejecutores de pruebas rápidas de contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.
- Las vías E2E de Docker/Bash que instalan el archivo tar empaquetado de OpenClaw mediante `scripts/lib/openclaw-e2e-instance.sh` limitan `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (valor predeterminado: `600s`; establezca `0` para deshabilitar el contenedor durante la depuración).

Los ejecutores de Docker de modelos en vivo también montan mediante enlace únicamente los directorios personales de autenticación de CLI necesarios
(o todos los compatibles cuando la ejecución no está acotada) y, después, los copian en el directorio personal del contenedor antes de la ejecución, para que OAuth de CLI externas pueda renovar los tokens
sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba rápida de enlace de ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba rápida del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba rápida del entorno del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Pruebas rápidas de observabilidad: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` y `pnpm qa:observability:smoke` son vías privadas de control de calidad para el código fuente extraído. Deliberadamente no forman parte de las vías de publicación de paquetes en Docker porque el archivo tar de npm omite el laboratorio de control de calidad.
- Prueba rápida en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, estructura completa): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba rápida de incorporación/canal/agente con archivo tar de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el archivo tar empaquetado de OpenClaw, configura OpenAI mediante una incorporación con referencia de variable de entorno y Telegram de forma predeterminada, ejecuta doctor y realiza un turno de agente de OpenAI simulado. Reutilice un archivo tar precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambie de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Prueba de humo del recorrido de usuario de la versión: `pnpm test:docker:release-user-journey` instala globalmente el tarball empaquetado de OpenClaw en un directorio personal limpio de Docker, ejecuta la incorporación, configura un proveedor simulado de OpenAI, ejecuta un turno del agente, instala y desinstala plugins externos, configura ClickClack con un fixture local, verifica la mensajería saliente y entrante, reinicia el Gateway y ejecuta doctor.
- Prueba de humo de incorporación tipada de la versión: `pnpm test:docker:release-typed-onboarding` instala el tarball empaquetado, controla `openclaw onboard` mediante una TTY real, configura OpenAI como proveedor con referencia a una variable de entorno, verifica que no se conserve la clave sin procesar y ejecuta un turno simulado del agente.
- Prueba de humo de medios y memoria de la versión: `pnpm test:docker:release-media-memory` instala el tarball empaquetado, verifica la comprensión de imágenes a partir de un archivo PNG adjunto, la salida de generación de imágenes compatible con OpenAI, la recuperación mediante búsqueda en memoria y la conservación de esa recuperación tras reiniciar el Gateway.
- Prueba de humo del recorrido de usuario de actualización de la versión: `pnpm test:docker:release-upgrade-user-journey` instala de forma predeterminada la versión base publicada más reciente que sea anterior al tarball candidato, configura el estado del proveedor, el plugin y ClickClack en el paquete publicado, actualiza al tarball candidato y vuelve a ejecutar el recorrido principal de agente, plugin y canal. Si no existe una versión base publicada anterior, reutiliza la versión candidata. Anule la versión base con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Prueba de humo del marketplace de plugins de la versión: `pnpm test:docker:release-plugin-marketplace` instala desde un marketplace de fixtures local, actualiza el plugin instalado, lo desinstala y verifica que la CLI del plugin desaparezca y que se depuren los metadatos de instalación.
- Prueba de humo de instalación de Skills: `pnpm test:docker:skill-install` instala globalmente el tarball empaquetado de OpenClaw en Docker, desactiva en la configuración las instalaciones desde archivos subidos, obtiene mediante una búsqueda el slug actual de una Skill activa de ClawHub, la instala con `openclaw skills install` y verifica la Skill instalada junto con los metadatos de origen y bloqueo de `.clawhub`.
- Prueba de humo de cambio del canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia del paquete `stable` a la versión git `dev`, verifica el canal conservado y el funcionamiento del plugin tras la actualización, vuelve después al paquete `stable` y comprueba el estado de actualización.
- Prueba de humo de supervivencia a la actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de un usuario antiguo que contiene agentes, configuración de canales, listas de plugins permitidos, estado obsoleto de dependencias de plugins y archivos existentes de espacios de trabajo y sesiones. Ejecuta la actualización del paquete y doctor en modo no interactivo sin claves activas de proveedores ni canales; después inicia un Gateway en local loopback y comprueba la conservación de la configuración y el estado, así como los límites de tiempo de inicio y estado.
- Prueba de humo publicada de supervivencia a la actualización: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, crea archivos realistas de un usuario existente, configura esa versión base con una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor en modo no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, inicia después un Gateway en local loopback y comprueba las intenciones configuradas, la conservación del estado, el inicio, `/healthz`, `/readyz` y los límites de tiempo del estado RPC. Anule una versión base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, solicite al planificador agregado que expanda versiones base locales exactas mediante `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, por ejemplo `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expanda fixtures con forma de incidencias mediante `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, por ejemplo `reported-issues`; el conjunto de incidencias notificadas incluye `configured-plugin-installs` para reparar automáticamente la instalación de plugins externos de OpenClaw. La aceptación de paquetes los expone como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de metaversión base como `last-stable-4` o `all-since-2026.4.23`, y la validación completa de la versión expande la comprobación del paquete de estabilidad prolongada de la versión a `last-stable-4 2026.4.23 2026.5.2 2026.4.15`, además de `reported-issues`.
- Prueba de humo del contexto de ejecución de sesiones: `pnpm test:docker:session-runtime-context` verifica la conservación en la transcripción del contexto de ejecución oculto, además de la reparación mediante doctor de las ramas duplicadas afectadas de reescritura de prompts.
- Prueba de humo de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala mediante `bun install -g` en un directorio personal aislado y verifica que `openclaw infer image providers --json` devuelva los proveedores de imágenes incluidos en lugar de quedarse bloqueado. Reutilice un tarball precompilado mediante `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la compilación en el host mediante `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copie `dist/` desde una imagen de Docker compilada mediante `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba de humo del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores de root, actualización y npm directo. La prueba de humo de actualización utiliza de forma predeterminada `latest` de npm como versión base estable antes de actualizar al tarball candidato. Anúlela localmente mediante `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` o mediante la entrada `update_baseline_version` del flujo de trabajo Install Smoke en GitHub. Las comprobaciones del instalador sin root mantienen una caché de npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de instalación local del usuario. Establezca `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché de root, actualización y npm directo entre ejecuciones locales.
- La CI de Install Smoke omite la actualización global duplicada mediante npm directo con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecute el script localmente sin esa variable de entorno cuando necesite cobertura directa de `npm install -g`.
- Prueba de humo de la CLI para eliminar agentes con un espacio de trabajo compartido: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen del Dockerfile raíz, crea dos agentes con un espacio de trabajo en un directorio personal de contenedor aislado, ejecuta `agents delete --json` y verifica que el JSON sea válido y que se conserve el comportamiento del espacio de trabajo. Reutilice la imagen de la prueba de instalación mediante `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes del Gateway y ciclo de vida del host: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`) conserva la prueba de humo de autenticación y estado de WebSocket en una LAN con dos contenedores; después utiliza HTTP de administración en local loopback para demostrar el bloqueo de preparación, el acceso de control conservado, la recuperación mediante reanudación y una detención y un inicio preparados dentro del mismo contenedor. La comprobación del reinicio debe finalizar antes de que venza el arrendamiento original, verifica que el estado de suspensión sea local al proceso mientras se conservan la configuración persistente del Gateway y la identidad del contenedor, y emite un JSON legible por máquinas con los tiempos de las fases.
- Prueba de humo de instantáneas CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E del código fuente junto con una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles de CDP incluyan las URL de los enlaces, los elementos interactivos promovidos por el cursor, las referencias de iframes y los metadatos de los marcos.
- Regresión de razonamiento mínimo de `web_search` en OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor simulado de OpenAI mediante el Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, fuerza después el rechazo del esquema por parte del proveedor y comprueba que los detalles sin procesar aparezcan en los registros del Gateway.
- Puente de canales MCP (Gateway inicializado + puente stdio + prueba de humo de marcos de notificación sin procesar de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete de OpenClaw (servidor MCP stdio real + prueba de humo de permisos y denegaciones con un perfil de OpenClaw integrado): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpieza de MCP de Cron y subagentes (Gateway real + finalización de procesos secundarios MCP stdio tras ejecuciones aisladas de Cron y ejecuciones únicas de subagentes): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba de humo de instalación y actualización para rutas locales, `file:`, registro de npm con dependencias elevadas, metadatos mal formados de paquetes npm, referencias móviles de git, conjunto completo de ClawHub, actualizaciones del marketplace y activación e inspección de paquetes de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Establezca `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub o anule el par predeterminado de paquete y entorno de ejecución del conjunto completo mediante `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba utiliza un servidor de fixtures local y hermético de ClawHub.
- Prueba de humo de actualización sin cambios de plugins: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba de humo de la matriz del ciclo de vida de plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor básico, instala un plugin de npm, alterna entre activarlo y desactivarlo, lo actualiza y vuelve a una versión anterior mediante un registro local de npm, elimina el código instalado y verifica después que la desinstalación siga eliminando el estado obsoleto mientras registra métricas de RSS y CPU para cada fase del ciclo de vida.
- Prueba de humo de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cubre las pruebas de humo de instalación y actualización para rutas locales, `file:`, registros de npm con dependencias elevadas, referencias móviles de git, fixtures de ClawHub, actualizaciones del marketplace y activación e inspección de paquetes de Claude. `pnpm test:docker:plugin-update` cubre el comportamiento de las actualizaciones sin cambios de los plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cubre la instalación, activación, desactivación, actualización, reversión a una versión anterior y desinstalación con código ausente de plugins de npm, con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las anulaciones de imágenes específicas de cada suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando se establecen. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si todavía no está disponible localmente. Las pruebas de QR y del instalador en Docker conservan sus propios Dockerfiles porque validan el comportamiento del paquete y la instalación, en lugar del entorno de ejecución compartido de la aplicación compilada.

Los ejecutores de Docker con modelos activos también montan el checkout actual en modo de solo lectura
y lo preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la
imagen del entorno de ejecución y, al mismo tiempo, permite ejecutar Vitest con su código fuente y
configuración locales exactos. El paso de preparación omite las cachés grandes que solo existen localmente y los
resultados de compilación de aplicaciones, como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y
los directorios locales de la aplicación `.build` o de resultados de Gradle, para que las ejecuciones activas de Docker no
dediquen minutos a copiar artefactos específicos de la máquina. También establecen
`OPENCLAW_SKIP_CHANNELS=1` para que las sondas activas del Gateway no inicien procesos reales de los canales
Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, por lo que también debe pasar
`OPENCLAW_LIVE_GATEWAY_*` cuando necesite limitar o excluir la cobertura activa del Gateway
de esa vía de Docker.

`test:docker:openwebui` es una prueba de humo de compatibilidad de nivel superior: inicia un
contenedor del Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor de Open WebUI con una versión fijada conectado a ese Gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y, a continuación, envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI. Establezca
`OPENWEBUI_SMOKE_MODE=models` para las comprobaciones de CI de la ruta de lanzamiento que deban detenerse
después del inicio de sesión en Open WebUI y la detección de modelos, sin esperar a que se complete
una respuesta de un modelo en vivo. La primera ejecución puede ser notablemente más lenta porque Docker quizá tenga que
descargar la imagen de Open WebUI y Open WebUI quizá deba completar su propia
configuración de arranque en frío. Esta vía requiere una clave de modelo en vivo utilizable, proporcionada mediante
el entorno del proceso, perfiles de autenticación preparados o un
`OPENCLAW_PROFILE_FILE` explícito. Las ejecuciones correctas imprimen una pequeña carga JSON como
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` es intencionadamente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor del Gateway
con datos iniciales, inicia un segundo contenedor que ejecuta `openclaw mcp serve` y, a continuación,
verifica la detección de conversaciones enrutadas, la lectura de transcripciones, los metadatos de
archivos adjuntos, el comportamiento de la cola de eventos en vivo, el enrutamiento de envíos salientes y las notificaciones
de canales y permisos al estilo de Claude a través del puente MCP stdio real. La
comprobación de notificaciones inspecciona directamente las tramas MCP stdio sin procesar para que la prueba de humo
valide lo que el puente emite realmente, no solo lo que un SDK de cliente específico
muestre por casualidad.

`test:docker:agent-bundle-mcp-tools` es determinista y no necesita una
clave de modelo en vivo. Compila la imagen Docker del repositorio, inicia un servidor de
prueba MCP stdio real dentro del contenedor, materializa ese servidor mediante el
entorno de ejecución MCP del paquete OpenClaw integrado, ejecuta la herramienta y, a continuación, verifica que
`coding` y `messaging` conserven las herramientas `bundle-mcp`, mientras que `minimal` y
`tools.deny: ["bundle-mcp"]` las filtren.

`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de
modelo en vivo. Inicia un Gateway con datos iniciales y un servidor de prueba MCP stdio real,
ejecuta un turno de Cron aislado y un turno secundario único de `sessions_spawn` y, a continuación,
verifica que el proceso secundario MCP finalice después de cada ejecución.

Prueba de humo manual de hilos ACP en lenguaje natural (no para CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserve este script para los flujos de regresión y depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, así que no lo elimine.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` se monta y se carga antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar únicamente las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, mediante directorios temporales de configuración y espacio de trabajo, sin montajes externos de autenticación de la CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`, salvo que la ejecución ya utilice un directorio de enlace administrado o de CI) montado en `/home/node/.npm-global` para almacenar en caché las instalaciones de herramientas de la CLI dentro de Docker
- Los directorios y archivos externos de autenticación de la CLI bajo `$HOME` se montan como de solo lectura bajo `/host-auth...` y, a continuación, se copian en `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados (utilizados cuando la ejecución no se limita a proveedores específicos): `.factory`, `.gemini`, `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones limitadas por proveedor montan únicamente los directorios y archivos necesarios deducidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Anule esta selección manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar los proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en repeticiones que no necesiten una nueva compilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales procedan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo que expone el Gateway para la prueba de humo de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sustituir la instrucción de comprobación del nonce utilizada por la prueba de humo de Open WebUI
- `OPENWEBUI_IMAGE=...` para sustituir la etiqueta fijada de la imagen de Open WebUI

## Comprobación básica de la documentación

Ejecute las comprobaciones de documentación después de editarla: `pnpm check:docs`.
Ejecute la validación completa de anclas de Mintlify cuando también necesite comprobar los encabezados internos de las páginas: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de la «canalización real» sin proveedores reales:

- Llamadas a herramientas del Gateway (OpenAI simulado, Gateway y bucle del agente reales): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del Gateway (WS `wizard.start`/`wizard.next`, escribe la configuración y exige autenticación): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evaluaciones de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como «evaluaciones de fiabilidad del agente»:

- Llamadas simuladas a herramientas mediante el Gateway y el bucle del agente reales (`src/gateway/gateway.test.ts`).
- Flujos integrales del asistente que validan la conexión de sesiones y los efectos de la configuración (`src/gateway/gateway.test.ts`).

Lo que todavía falta para Skills (consulte [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando se enumeran Skills en la instrucción, ¿elige el agente la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿lee el agente `SKILL.md` antes de usarla y sigue los pasos y argumentos requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifiquen el orden de las herramientas, la conservación del historial de la sesión y los límites del entorno aislado.

Las evaluaciones futuras deben seguir siendo deterministas en primer lugar:

- Un ejecutor de escenarios que use proveedores simulados para comprobar las llamadas y el orden de las herramientas, las lecturas de archivos de Skills y la conexión de sesiones.
- Un pequeño conjunto de escenarios centrados en Skills (uso frente a omisión, controles e inyección de instrucciones).
- Evaluaciones en vivo opcionales (con habilitación explícita y controladas mediante variables de entorno) solo después de disponer del conjunto seguro para CI.

## Pruebas de contrato (estructura de plugins y canales)

Las pruebas de contrato verifican que cada Plugin y canal registrado cumpla
su contrato de interfaz. Recorren todos los plugins detectados y ejecutan un
conjunto de comprobaciones de estructura y comportamiento. La vía unitaria predeterminada `pnpm test`
omite intencionadamente estos archivos compartidos de interfaces y pruebas de humo; ejecute los comandos
de contrato explícitamente cuando modifique superficies compartidas de canales o proveedores.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Se encuentran en `src/channels/plugins/contracts/*.contract.test.ts`. Categorías
actuales de nivel superior:

- **channel-catalog**: metadatos de las entradas del catálogo de canales integrados o del registro
- **plugin** (respaldado por el registro, fragmentado): estructura básica de registro de plugins
- **surfaces-only** (respaldado por el registro, fragmentado): comprobaciones de estructura por superficie para `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` y `gateway`
- **session-binding** (respaldado por el registro): comportamiento de vinculación de sesiones
- **outbound-payload**: estructura y normalización de la carga de mensajes
- **group-policy** (alternativa): aplicación de la política de grupos predeterminada por canal
- **threading** (respaldado por el registro, fragmentado): gestión de identificadores de hilos
- **directory** (respaldado por el registro, fragmentado): API de directorio/lista de miembros
- **registry** y **plugins-core.\***: registro de plugins de canales, cargador y componentes internos de autorización de escritura de configuración

Los auxiliares del entorno de pruebas para capturar la distribución entrante y las cargas salientes utilizados por estos
conjuntos se exponen internamente mediante `src/plugin-sdk/channel-contract-testing.ts`
(excluido de npm, no es una subruta pública del SDK); no existe ningún archivo independiente
`inbound.contract.test.ts` en este directorio.

### Contratos de proveedores

Se encuentran en `src/plugins/contracts/*.contract.test.ts`. Las categorías actuales
incluyen:

- **shape**: estructura del manifiesto, la API y las exportaciones del entorno de ejecución del Plugin
- **plugin-registration** (+ paralelo): casos de registro de manifiestos
- **package-manifest**: requisitos del manifiesto del paquete
- **loader**: comportamiento de configuración y desmontaje del cargador de plugins
- **registry**: contenido y búsqueda del registro de contratos de plugins
- **providers**: comportamiento compartido de los proveedores integrados, además de los proveedores de búsqueda web
- **auth-choice**: metadatos de elección de autenticación y comportamiento de configuración
- **provider-catalog-deprecation**: metadatos obsoletos del catálogo de proveedores
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options**: contratos del asistente de configuración de proveedores
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts**: contratos de proveedores específicos de cada capacidad
- **session-actions**, **session-attachments**, **session-entry-projection**: contratos del estado de sesión propiedad del Plugin
- **scheduled-turns**: metadatos de turnos programados y límites de marcas de tiempo del Plugin
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams**: contratos del ciclo de vida del host y del entorno de ejecución del Plugin, y de los límites de importación
- **extension-runtime-dependencies**: ubicación de las dependencias del entorno de ejecución de las extensiones

### Cuándo ejecutarlas

- Después de cambiar las exportaciones o subrutas de `plugin-sdk`
- Después de añadir o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o la detección de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Incorporación de regresiones (orientación)

Cuando corrija un problema de proveedor o modelo detectado en vivo:

- Añada una regresión segura para CI si es posible (proveedor simulado o auxiliar, o capture la transformación exacta de la estructura de la solicitud)
- Si el problema solo puede reproducirse en vivo por su naturaleza (límites de frecuencia, políticas de autenticación), mantenga la prueba en vivo acotada y con habilitación explícita mediante variables de entorno
- Procure dirigirse a la capa más pequeña que detecte el error:
  - error de conversión o reproducción de solicitudes del proveedor -> prueba directa de modelos
  - error de sesión, historial o canalización de herramientas del Gateway -> prueba de humo en vivo del Gateway o prueba simulada del Gateway segura para CI
- Protección del recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` obtiene un destino de muestra por cada clase de SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`) y, a continuación, comprueba que se rechacen los identificadores de ejecución con segmentos de recorrido.
  - Si añade una nueva familia de destinos SecretRef con `includeInPlan` en `src/secrets/target-registry-data.ts`, actualice `classifyTargetClass` en esa prueba. La prueba falla intencionadamente con los identificadores de destino no clasificados para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
