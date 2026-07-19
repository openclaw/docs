---
read_when:
    - Ejecución de pruebas localmente o en CI
    - Adición de pruebas de regresión para errores de modelos/proveedores
    - Depuración del comportamiento del Gateway y del agente
summary: 'Kit de pruebas: suites unitarias, e2e y en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-07-19T01:56:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20e0aa22bf16561334f83342abffabb387ed0b41b901773939123ecfbc0ae330
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres conjuntos de pruebas de Vitest (unitarias/integración, e2e, live), además de ejecutores de Docker. Esta página explica qué cubre cada conjunto, qué comando ejecutar para un flujo de trabajo determinado, cómo las pruebas live detectan las credenciales y cómo añadir regresiones para errores reales de proveedores/modelos.

<Note>
La **pila de QA (qa-lab, qa-channel, carriles de transporte live)** se documenta por separado:

- [Descripción general de QA](/es/concepts/qa-e2e-automation): arquitectura, superficie de comandos, creación de escenarios y perfiles de Matrix.
- [Cuadro de indicadores de madurez](/es/maturity/scorecard): cómo la evidencia de QA de las versiones respalda las decisiones sobre estabilidad y LTS.
- [Canal de QA](/es/channels/qa-channel): el plugin de transporte sintético utilizado por los escenarios respaldados por el repositorio.

Esta página cubre los conjuntos de pruebas habituales y los ejecutores de Docker/Parallels. La sección [Ejecutores específicos de QA](#qa-specific-runners) siguiente enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Comprobación completa (requerida antes de hacer push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida del conjunto completo en una máquina con recursos suficientes: `pnpm test:max`
- Bucle de observación directo de Vitest: `pnpm test:watch`
- La selección directa de archivos también enruta las rutas de plugins/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Al iterar sobre un único fallo, se recomienda comenzar con ejecuciones específicas.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Carril de QA respaldado por una máquina virtual Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Al modificar pruebas o buscar mayor confianza:

- Informe informativo de cobertura de V8: `pnpm test:coverage`
- Conjunto E2E: `pnpm test:e2e`

## Directorios temporales de prueba

Utilice los asistentes compartidos de `test/helpers/temp-dir.ts` para los directorios temporales propiedad de las pruebas, de modo que la propiedad sea explícita y la limpieza permanezca dentro del ciclo de vida de la prueba:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("usa un espacio de trabajo temporal", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // usar el espacio de trabajo
});
```

`useAutoCleanupTempDirTracker(afterEach)` no expone intencionadamente ningún método de limpieza manual: Vitest se encarga de la limpieza después de cada prueba. Los asistentes anteriores de nivel inferior (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) siguen disponibles para las pruebas que aún no se han migrado; evite utilizarlos en código nuevo y evite nuevas llamadas directas a `fs.mkdtemp*`, salvo que una prueba verifique explícitamente el comportamiento básico de los directorios temporales. Cuando sea realmente necesario utilizar directamente un directorio temporal, añada un comentario de permiso auditable con una justificación:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` informa sobre la creación de nuevos directorios temporales directos y el nuevo uso manual de asistentes compartidos en las líneas añadidas del diff, sin bloquear los estilos de limpieza existentes. Sigue la misma clasificación de rutas de prueba que `scripts/changed-lanes.mjs` y omite la propia implementación del asistente compartido. `check:changed` ejecuta este informe para las rutas de prueba modificadas como una señal de CI que solo genera advertencias (anotaciones de advertencia de GitHub, no fallos).

## Flujos de trabajo live y de Docker/Parallels

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Conjunto live (modelos y pruebas de herramientas/imágenes del Gateway): `pnpm test:live`
- Ejecución silenciosa de un archivo live específico: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento del entorno de ejecución: ejecute `OpenClaw Performance` con
  `live_openai_candidate=true` para un turno real de agente `openai/gpt-5.6-luna` o
  `deep_profile=true` para obtener artefactos de CPU/heap/traza de Kova. Las ejecuciones programadas diarias
  publican informes del proveedor simulado, del perfil detallado y del carril GPT-5.6 Luna en
  `openclaw/clawgrit-reports` desde un trabajo publicador independiente que consume artefactos;
  la ausencia o invalidez de la autenticación del publicador hace que fallen las ejecuciones programadas y
  `profile=release`. Las ejecuciones manuales que no son de lanzamiento conservan los artefactos de GitHub
  y consideran orientativa la publicación de informes. El informe del proveedor simulado también
  incluye cifras de arranque del Gateway a nivel de código fuente, memoria, presión de plugins, bucle de saludo
  repetido del modelo simulado e inicio de la CLI.
- Barrido live de modelos en Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ejecuta un turno de texto y una pequeña prueba similar a la lectura de archivos.
    Los modelos cuyos metadatos anuncian entrada `image` también ejecutan un pequeño turno con imagen.
    Desactive las pruebas adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedores.
  - Cobertura de CI: tanto la ejecución diaria `OpenClaw Scheduled Live And E2E Checks` como la manual
    `OpenClaw Release Checks` llaman al flujo de trabajo live/E2E reutilizable con
    `include_live_suites: true`, que incluye trabajos de matriz de modelos live en Docker
    divididos por proveedor.
  - Para repeticiones específicas en CI, ejecute `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añada nuevos secretos de proveedores con señales de alta calidad a `scripts/ci-hydrate-live-auth.sh`,
    además de a `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y sus
    invocadores programados/de lanzamiento.
- Prueba de humo nativa del chat vinculado de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un carril live de Docker sobre la ruta del servidor de aplicaciones de Codex, vincula un
    mensaje directo sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions` y, a continuación, verifica que una respuesta de texto sin formato y un archivo adjunto de imagen
    se enruten mediante la vinculación nativa del plugin en lugar de ACP.
- Prueba de humo del arnés del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos de agente del Gateway mediante el arnés del servidor de aplicaciones de Codex
    propiedad del plugin, verifica `/codex status` y `/codex models` y, de forma predeterminada,
    ejercita pruebas de imagen, MCP de Cron, subagente y Guardian. Desactive la
    prueba de subagente con `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al
    aislar otros fallos. Para una comprobación específica del subagente, desactive las
    demás pruebas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto finaliza después de la prueba del subagente, salvo que
    se establezca `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Prueba de humo de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala el tarball empaquetado de OpenClaw en Docker, ejecuta la
    incorporación mediante una clave de API de OpenAI y verifica que el plugin de Codex y la dependencia
    `@openai/codex` se descarguen bajo demanda en la raíz del proyecto npm administrado.
- Prueba de humo live del paquete del plugin npm de Codex: `pnpm test:docker:live-codex-npm-plugin`
  - Instala el paquete candidato de OpenClaw y el plugin exacto de Codex en Docker
    y, a continuación, utiliza una clave real de OpenAI para la comprobación previa de la CLI y turnos en la misma sesión.
  - Su turno de seguimiento con razonamiento medio y cero reintentos debe enviar progreso, continuar
    trabajando mediante lecturas aleatorias del espacio de trabajo y una escritura exacta de un artefacto
    y, después, enviar la finalización. Un turno terminal que solo indique progreso hace que falle el carril.
- Prueba de humo live de dependencias de herramientas de plugins: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un plugin de prueba con una dependencia real `slugify`, lo instala
    mediante `npm-pack:`, verifica la dependencia bajo la raíz del proyecto npm
    administrado y, a continuación, solicita a un modelo live de OpenAI que llame a la herramienta del plugin y
    devuelva el slug oculto.
- Prueba de humo del comando de rescate de OpenClaw: `pnpm test:live:system-agent-rescue-channel`
  - Comprobación opcional con redundancia adicional de la superficie del comando de rescate
    del canal de mensajes. Ejercita `/openclaw status`, pone en cola un cambio persistente
    de modelo, responde `/openclaw yes` y verifica la ruta de escritura de auditoría/configuración.
- Prueba de humo de la primera ejecución de OpenClaw en Docker: `pnpm test:docker:system-agent-first-run`
  - Parte de un directorio de estado vacío de OpenClaw y primero demuestra que la CLI
    empaquetada `openclaw setup` falla de forma cerrada sin inferencias. Después,
    prueba y activa un Claude simulado mediante el módulo de activación empaquetado.
    Solo entonces una solicitud imprecisa de la CLI empaquetada llega al planificador y
    se resuelve como una configuración tipada, seguida de operaciones únicas de modelo, agente,
    configuración de Discord y SecretRef. Valida la configuración y las entradas de auditoría. Esto constituye
    evidencia de respaldo sobre la comprobación/operación, no una prueba de incorporación interactiva ni
    del agente/herramienta/aprobación de OpenClaw. El mismo carril está disponible en QA Lab mediante
    `pnpm openclaw qa suite --scenario system-agent-ring-zero-setup`.
- Prueba de humo de costes de Moonshot/Kimi: con `MOONSHOT_API_KEY` establecido, ejecute
  `openclaw models list --provider moonshot --json` y, después, ejecute un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` aislado
  sobre `moonshot/kimi-k2.6`. Verifique que el JSON informa de Moonshot/K2.6 y que la
  transcripción del asistente almacena el valor normalizado `usage.cost`.

<Tip>
Cuando solo sea necesario comprobar un caso que falla, se recomienda limitar las pruebas live mediante las variables de entorno de lista de permitidos descritas a continuación.
</Tip>

## Ejecutores específicos de QA

Estos comandos complementan los principales conjuntos de pruebas cuando se necesita el realismo de QA Lab.

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad agéntica está incluida en
`QA-Lab - All Lanes` y en la validación de versiones, no en un flujo de trabajo independiente para pull requests.
La validación amplia debe utilizar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de QA de comprobaciones de versiones. Las comprobaciones
estables/predeterminadas de versiones mantienen la prueba exhaustiva live/Docker detrás de `run_release_soak=true`;
el perfil `full` la fuerza. `QA-Lab - All Lanes` se ejecuta cada noche en `main` y
mediante ejecución manual con el carril de paridad simulado, el carril live de Matrix,
el carril live de Telegram administrado por Convex y el carril live de Discord administrado por Convex
como trabajos paralelos. La QA programada y las comprobaciones de versiones ejecutan el perfil de lanzamiento de Matrix
mediante el adaptador live compartido. El valor predeterminado de la CLI de Matrix y de la entrada manual del flujo de trabajo
sigue siendo `all`; las ejecuciones manuales de `all` distribuyen los perfiles de transporte, medios y
E2EE, mientras que las ejecuciones específicas pueden seleccionar `fast`, `release` o
`transport`. `OpenClaw Release Checks` ejecuta la paridad, además del perfil reutilizable del adaptador
live de Matrix y el carril de Telegram, antes de aprobar la versión. Las comprobaciones
de transporte de la versión utilizan `mock-openai/gpt-5.6-luna` para mantener el determinismo y
evitar el inicio normal de plugins de proveedores. Estos Gateways de transporte live
desactivan la búsqueda en memoria; el comportamiento de la memoria sigue cubierto por los conjuntos de paridad de QA.

Los fragmentos de medios live de la versión completa utilizan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya incluye
`ffmpeg` y `ffprobe`. Los fragmentos live de modelos/backends de Docker utilizan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>`, compilada una vez por cada
commit seleccionado, y después la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de volver a compilarla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Escribe artefactos de nivel superior `qa-evidence.json`, `qa-suite-summary.json` y
    `qa-suite-report.md` para el conjunto de escenarios seleccionado, incluidas
    selecciones de escenarios de flujo mixto, Vitest y Playwright.
  - Cuando lo inicia `pnpm openclaw qa run --qa-profile <profile>`, incorpora
    la tabla de puntuación del perfil de taxonomía seleccionado en el mismo `qa-evidence.json`.
    `smoke-ci` escribe evidencia reducida (`evidenceMode: "slim"`, sin
    `execution` por entrada). `release` cubre la selección depurada de preparación para el lanzamiento; `all`
    selecciona todas las categorías de madurez activas y se dirige a ejecuciones explícitas
    del flujo de trabajo de evidencia de perfiles de QA cuando se necesita un artefacto
    completo de tabla de puntuación.
  - Ejecuta de forma predeterminada varios escenarios seleccionados en paralelo con
    procesos de Gateway aislados. `qa-channel` usa de forma predeterminada una concurrencia de 4 (limitada por la
    cantidad de escenarios seleccionados). Use `--concurrency <count>` para ajustar la cantidad
    de procesos, o `--concurrency 1` para la vía serial anterior.
  - Finaliza con un código distinto de cero cuando falla algún escenario. Use `--allow-failures` para
    generar artefactos sin un código de salida de error.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para la cobertura
    experimental de fixtures y simulaciones de protocolo sin sustituir la vía
    `mock-openai` con reconocimiento de escenarios.
- `pnpm openclaw qa coverage --match <query>`
  - Busca en identificadores y títulos de escenarios, superficies, identificadores de cobertura, referencias de
    documentación y código, plugins y requisitos de proveedores, y después muestra los
    destinos de suites coincidentes.
  - Use esto antes de una ejecución de QA Lab cuando conozca el comportamiento o la ruta de archivo
    afectados, pero no el escenario más pequeño. Es solo orientativo: aún debe elegir la
    prueba simulada, en vivo, de Multipass, Matrix o de transporte según el comportamiento que
    se está modificando.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta el conjunto exhaustivo en vivo del plugin OpenAI Kitchen Sink mediante QA Lab.
    Instala el paquete externo Kitchen Sink, verifica el inventario de superficies
    del SDK de plugins, sondea `/healthz` y `/readyz`, registra evidencia de
    CPU/RSS del Gateway, ejecuta un turno de OpenAI en vivo y comprueba diagnósticos
    adversariales. Requiere autenticación de OpenAI en vivo, como `OPENAI_API_KEY`. En
    sesiones hidratadas de Testbox, carga automáticamente el perfil de autenticación en vivo
    de Testbox cuando está presente el auxiliar `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta el banco de pruebas de inicio del Gateway junto con un pequeño conjunto de escenarios simulados de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observaciones
    de CPU en `.artifacts/gateway-cpu-scenarios/`.
  - De forma predeterminada, solo marca observaciones sostenidas de uso elevado de CPU (`--cpu-core-warn`,
    valor predeterminado `0.9`; `--hot-wall-warn-ms`, valor predeterminado `30000`), por lo que los picos breves
    del inicio se registran como métricas sin que parezcan la regresión de saturación
    del Gateway que dura varios minutos.
  - Se ejecuta con artefactos compilados de `dist`; ejecute primero una compilación cuando el checkout
    aún no tenga una salida de tiempo de ejecución reciente.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una máquina virtual Linux desechable de Multipass y mantiene
    las mismas opciones de selección de escenarios y de proveedor/modelo que `qa suite`.
  - Las ejecuciones en vivo reenvían las entradas de autenticación de QA que resultan prácticas para el sistema invitado:
    claves de proveedor basadas en variables de entorno, la ruta de configuración del proveedor en vivo de QA y
    `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el sistema invitado pueda escribirlos
    de vuelta mediante el espacio de trabajo montado.
  - Escribe el informe y el resumen normales de QA, además de los registros de Multipass, en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para tareas de QA orientadas a operadores.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Compila un tarball de npm a partir del checkout actual, lo instala globalmente en
    Docker, ejecuta la incorporación no interactiva con una clave de API de OpenAI, configura
    Telegram de forma predeterminada, verifica que el tiempo de ejecución del plugin empaquetado se cargue sin
    reparar dependencias durante el inicio, ejecuta doctor y realiza un turno de agente local
    contra un endpoint simulado de OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma vía de instalación
    empaquetada con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta una prueba de humo determinista en Docker de la aplicación compilada para transcripciones de contexto
    del tiempo de ejecución integrado. Verifica que el contexto oculto del tiempo de ejecución de OpenClaw persista como un
    mensaje personalizado no visible en lugar de filtrarse al turno visible del usuario;
    después, inicializa un JSONL de sesión afectada y dañada y verifica que
    `openclaw doctor --fix` lo reescriba en la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala un paquete candidato de OpenClaw en Docker, ejecuta la incorporación
    del paquete instalado, configura Telegram mediante la CLI instalada y después reutiliza
    la vía de QA en vivo de Telegram con ese paquete instalado como Gateway del SUT.
  - El contenedor solo monta el código fuente del entorno de pruebas `qa-lab` desde el checkout;
    el paquete instalado es responsable de `dist`, `openclaw/plugin-sdk` y del tiempo de ejecución
    de los plugins incluidos, por lo que la vía no mezcla los plugins del checkout actual con
    el paquete sometido a prueba.
  - El valor predeterminado es `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; establezca
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para probar un tarball local resuelto en lugar
    de instalarlo desde el registro.
  - De forma predeterminada, emite mediciones repetidas de RTT en `qa-evidence.json` con
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescriba
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la ejecución.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` selecciona el escenario de QA de Telegram que
    se muestreará; el destino de RTT admitido es `channel-canary`.
  - Usa las mismas credenciales de entorno de Telegram o la misma fuente de credenciales de Convex que
    `pnpm openclaw qa telegram`. Para la automatización de CI/lanzamientos, establezca
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` junto con
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en
    CI, el contenedor de Docker selecciona Convex automáticamente.
  - El contenedor valida en el host las variables de entorno de credenciales de Telegram o Convex
    antes de las tareas de compilación e instalación de Docker. Establezca
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` solo cuando
    se depure deliberadamente la configuración previa a las credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe
    el valor compartido `OPENCLAW_QA_CREDENTIAL_ROLE` solo para esta vía. Cuando se
    seleccionan credenciales de Convex y no se establece ningún rol, el contenedor usa `ci` en CI
    y `maintainer` fuera de CI.
  - GitHub Actions presenta esta vía como el flujo de trabajo manual para mantenedores
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el
    entorno `qa-live-shared` y arrendamientos de credenciales de CI de Convex.
- GitHub Actions también presenta `Package Acceptance` para realizar pruebas de producto paralelas
  con un único paquete candidato. Acepta una referencia de Git, una especificación de npm publicada,
  una URL HTTPS de tarball con SHA-256, una política de URL de confianza o un artefacto de tarball
  de otra ejecución (`source=ref|npm|url|trusted-url|artifact`), carga el archivo
  `openclaw-current.tgz` normalizado como `package-under-test` y después ejecuta el
  programador E2E existente de Docker con los perfiles de vía `smoke`, `package`, `product`, `full`
  o `custom`. Establezca `telegram_mode=mock-openai` o
  `live-frontier` para ejecutar el flujo de trabajo de QA de Telegram con el mismo
  artefacto `package-under-test`.
  - Prueba de producto de la versión beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba con una URL exacta de tarball requiere un resumen y usa la política de seguridad para URL públicas:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Los espejos empresariales/privados de tarballs usan una política explícita de fuente de confianza:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lee `.github/package-trusted-sources.json` desde la referencia de confianza del flujo de trabajo y no acepta credenciales de URL ni una omisión de red privada mediante una entrada del flujo de trabajo. Si la política indicada declara autenticación mediante token al portador, configure el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prueba de artefactos descarga un artefacto de tarball de otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el
    Gateway con OpenAI configurado y después habilita los canales/plugins incluidos mediante
    modificaciones de configuración.
  - Verifica que el descubrimiento durante la configuración mantenga ausentes los plugins descargables
    no configurados, que la primera reparación configurada de doctor instale explícitamente
    cada plugin descargable que falte y que un segundo reinicio no ejecute
    una reparación oculta de dependencias.
  - También instala una versión base anterior conocida de npm, habilita Telegram antes de
    ejecutar `openclaw update --tag <candidate>` y verifica que
    el doctor posterior a la actualización del candidato elimine los residuos de dependencias de plugins heredados
    sin una reparación postinstall por parte del entorno de pruebas.
- `pnpm test:parallels:npm-update`
  - Ejecuta la prueba de humo nativa de actualización de la instalación empaquetada en sistemas invitados de Parallels.
    Cada plataforma seleccionada instala primero el paquete base solicitado,
    después ejecuta el comando `openclaw update` instalado en el mismo sistema invitado y
    verifica la versión instalada, el estado de actualización, la disponibilidad del Gateway y
    un turno de agente local.
  - Use `--platform macos`, `--platform windows` o `--platform linux`
    mientras itera en un solo sistema invitado. Use `--json` para consultar la ruta del artefacto
    de resumen y el estado de cada vía.
  - La vía de OpenAI usa `openai/gpt-5.6-luna` de forma predeterminada para la prueba del turno
    de agente en vivo. Proporcione `--model <provider/model>` o establezca
    `OPENCLAW_PARALLELS_OPENAI_MODEL` para validar otro modelo de OpenAI.
  - Envuelva las ejecuciones locales prolongadas en un tiempo de espera del host para que los bloqueos
    del transporte de Parallels no consuman el resto del periodo de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros anidados de las vías en
    `/tmp/openclaw-parallels-npm-update.*`. Inspeccione `windows-update.log`,
    `macos-update.log` o `linux-update.log` antes de suponer que el
    contenedor externo está bloqueado.
  - La actualización de Windows puede tardar entre 10 y 15 minutos en las tareas de doctor
    posteriores a la actualización y de actualización del paquete en un sistema invitado en frío; el funcionamiento sigue siendo correcto si
    el registro de depuración anidado de npm continúa avanzando.
  - No ejecute este contenedor agregado en paralelo con vías individuales de prueba de humo
    de macOS, Windows o Linux en Parallels. Comparten el estado de las máquinas virtuales y pueden
    entrar en conflicto al restaurar instantáneas, servir paquetes o gestionar el estado del Gateway invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidades, como síntesis de voz, generación de imágenes y comprensión
    multimedia, se cargan mediante las API del tiempo de ejecución incluido aunque el turno
    del agente solo compruebe una respuesta de texto sencilla.

- `pnpm openclaw qa aimock`
  - Inicia únicamente el servidor local del proveedor AIMock para realizar pruebas
    de humo directas del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la vía de QA en vivo de Matrix contra un servidor doméstico Tuwunel
    desechable respaldado por Docker. Solo para el checkout del código fuente: las instalaciones empaquetadas no incluyen
    `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y disposición de artefactos:
    [Vías de pruebas de humo de Matrix](/es/concepts/qa-e2e-automation#matrix-smoke-lanes).
- `pnpm openclaw qa telegram`
  - Ejecuta la vía de QA en vivo de Telegram contra un grupo privado real mediante los
    tokens del bot controlador y del SUT proporcionados por el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id. del grupo debe ser el id. numérico
    del chat de Telegram.
  - Admite `--credential-source convex` para credenciales agrupadas compartidas.
    Use el modo de entorno de forma predeterminada o establezca `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    para habilitar las concesiones del grupo.
  - Los valores predeterminados abarcan la versión canary, el control de menciones, el direccionamiento de comandos, `/status`,
    las respuestas mencionadas entre bots y las respuestas de comandos nativos del núcleo.
    Los valores predeterminados de `mock-openai` también abarcan las regresiones deterministas de cadenas de respuestas y
    de streaming del mensaje final de Telegram. Use `--list-scenarios`
    para sondeos opcionales como `session_status`.
  - Finaliza con un código distinto de cero cuando falla algún escenario. Use `--allow-failures` para obtener
    artefactos sin un código de salida de error.
  - Requiere dos bots distintos en el mismo grupo privado, y el bot SUT
    debe exponer un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilite Bot-to-Bot Communication Mode
    en `@BotFather` para ambos bots y asegúrese de que el bot controlador pueda observar
    el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y `qa-evidence.json` en
    `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen el RTT desde la solicitud
    de envío del controlador hasta la respuesta observada del SUT.

`Mantis Telegram Live` es el contenedor de evidencias de PR de esta vía. Ejecuta
la referencia candidata con credenciales de Telegram concedidas por Convex, representa el
paquete censurado de informe/evidencias de QA en un navegador de escritorio de Crabbox, graba
evidencias en MP4, genera un GIF recortado según el movimiento, carga el paquete de artefactos y
publica evidencias insertadas en el PR mediante la aplicación de GitHub de Mantis cuando se
establece `pr_number`. Los mantenedores pueden iniciarlo desde la interfaz de Actions mediante `Mantis Scenario`
(`scenario_id: telegram-live`) o directamente desde un comentario de pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
```

`Mantis Telegram Desktop Proof` es el contenedor agéntico nativo de Telegram Desktop
para las pruebas visuales de antes y después del PR. Inícielo desde la interfaz de Actions con
`instructions` de formato libre, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) o desde un comentario de PR:

```text
@openclaw-mantis telegram desktop proof
```

El agente Mantis lee el PR, decide qué comportamiento visible en Telegram demuestra
el cambio, ejecuta la vía de pruebas de usuario real de Telegram Desktop en Crabbox
para las referencias de base y candidata, itera hasta que los GIF nativos resultan útiles,
escribe un manifiesto `motionPreview` emparejado y publica la misma tabla de GIF
de 2 columnas mediante la aplicación de GitHub de Mantis cuando se establece `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Concede o reutiliza un escritorio Linux de Crabbox, instala Telegram
    Desktop nativo, configura OpenClaw con un token concedido del bot SUT de Telegram,
    inicia el Gateway y graba evidencias de capturas de pantalla/MP4 desde el
    escritorio VNC visible.
  - El valor predeterminado es `--credential-source convex`, de modo que los flujos de trabajo solo necesiten el
    secreto del intermediario Convex. Use `--credential-source env` con las mismas
    variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop sigue necesitando un inicio de sesión/perfil de usuario. El token del bot
    solo configura OpenClaw. Use `--telegram-profile-archive-env <name>`
    para un archivo de perfil `.tgz` en base64, o use `--keep-lease` e inicie sesión
    manualmente mediante VNC una vez.
  - Escribe `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4`
    en el directorio de salida.

Las vías de transporte en vivo comparten un contrato estándar para que los nuevos transportes no
divergan; la matriz de cobertura por vía se encuentra en
[Descripción general de QA: cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` es el conjunto sintético amplio y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
está habilitado para la QA de transporte en vivo, el laboratorio de QA adquiere una concesión exclusiva de un
grupo respaldado por Convex, mantiene el Heartbeat de esa concesión mientras se ejecuta la vía y
libera la concesión al apagarse. El nombre de la sección es anterior a la compatibilidad con Discord, Slack y
WhatsApp; el contrato de concesión se comparte entre los tipos.

Estructura de referencia del proyecto Convex: `qa/convex-credential-broker/`

Variables de entorno obligatorias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por ejemplo, `https://your-deployment.convex.site`)
- Un secreto para el rol seleccionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Selección del rol de credenciales:
  - CLI: `--credential-role maintainer|ci`
  - Valor predeterminado del entorno: `OPENCLAW_QA_CREDENTIAL_ROLE` (el valor predeterminado es `ci` en CI y `maintainer` en los demás casos)

Variables de entorno opcionales:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valor predeterminado: `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valor predeterminado: `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valor predeterminado: `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valor predeterminado: `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valor predeterminado: `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id. de seguimiento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URL de Convex `http://` de bucle invertido para el desarrollo exclusivamente local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` durante el funcionamiento normal.

Los comandos administrativos para mantenedores (añadir/eliminar/listar grupos) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Ayudantes de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de las ejecuciones en vivo para comprobar la URL del sitio de Convex, los secretos del intermediario,
el prefijo del punto de conexión, el tiempo de espera HTTP y la accesibilidad administrativa/de listado sin imprimir
los valores secretos. Use `--json` para obtener una salida legible por máquinas en scripts y utilidades
de CI.

Contrato predeterminado del punto de conexión (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Las solicitudes se autentican con un encabezado `Authorization: Bearer <role secret>`;
los cuerpos siguientes omiten dicho encabezado:

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
- `POST /admin/add` (solo secreto del mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secreto del mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección de concesión activa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secreto del mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Estructura de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena con un id. numérico de chat de Telegram.
- `admin/add` valida esta estructura para `kind: "telegram"` y rechaza las cargas útiles mal formadas.

Estructura de la carga útil para el tipo de usuario real de Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` está reservado para el flujo de trabajo de pruebas de Telegram Desktop de Mantis. Las vías genéricas del laboratorio de QA no deben adquirirlo.

Cargas útiles multicanal validadas por el intermediario:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Las vías de Slack también pueden obtener concesiones del grupo, pero la validación de la carga útil de Slack
se encuentra actualmente en el ejecutor de QA de Slack, no en el intermediario. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para las filas de Slack.

### Adición de un canal a QA

La arquitectura y los nombres de los ayudantes de escenarios para nuevos adaptadores de canal se encuentran en
[Descripción general de QA: adición de un canal](/es/concepts/qa-e2e-automation#adding-a-channel).
El requisito mínimo: implementar el ejecutor de transporte en la interfaz de host compartida `qa-lab`,
añadir un `adapterFactory` para los escenarios compartidos, declarar `qaRunners` en el
manifiesto del plugin, montarlo como `openclaw qa <runner>` y crear escenarios en
`qa/scenarios/`.

## Conjuntos de pruebas (qué se ejecuta y dónde)

Considere los conjuntos como un «realismo creciente» (y una inestabilidad/coste también crecientes).

### Unitarias / integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin objetivo usan el conjunto de particiones `vitest.full-*.config.ts` y pueden
  expandir las particiones de varios proyectos en configuraciones por proyecto para la
  programación en paralelo
- Archivos: inventarios del núcleo/unitarios en `src/**/*.test.ts`,
  `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de la interfaz de usuario se ejecutan en la
  partición dedicada `unit-ui`
- Ámbito:
  - Pruebas unitarias puras
  - Pruebas de integración dentro del proceso (autenticación del Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas de errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del solucionador y del cargador de superficies públicas deben demostrar el comportamiento general de reserva de `api.js` y
    `runtime-api.js` con pequeñas estructuras de plugin generadas,
    no con API reales del código fuente de plugins incluidos. Las cargas reales de API de plugins corresponden a
    conjuntos de pruebas de contrato/integración propiedad del plugin.

Política de dependencias nativas:

- Las instalaciones de pruebas predeterminadas omiten las compilaciones nativas opcionales de Opus para Discord. La voz de Discord
  usa `libopus-wasm` incluido, y `@discordjs/opus` permanece deshabilitado en
  `allowBuilds` para que las pruebas locales y las vías de Testbox no compilen el
  complemento nativo.
- Compare el rendimiento de Opus nativo en el repositorio de pruebas de rendimiento `libopus-wasm`, no
  en los bucles predeterminados de instalación/pruebas de OpenClaw. No establezca `@discordjs/opus` en
  `true` en el archivo `allowBuilds` predeterminado; eso hace que bucles de instalación/pruebas no relacionados
  compilen código nativo.

<AccordionGroup>
  <Accordion title="Proyectos, particiones y vías con ámbito">

    - La ejecución no dirigida de `pnpm test` utiliza trece configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigantesco del proyecto raíz. Esto reduce el RSS máximo en máquinas con carga y evita que el trabajo de respuesta automática y de plugins prive de recursos a conjuntos de pruebas no relacionados.
    - `pnpm test --watch` sigue utilizando el grafo de proyectos nativo de `vitest.config.ts` raíz, porque un bucle de vigilancia con varios fragmentos no resulta práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` dirigen primero los destinos explícitos de archivos y directorios por carriles con ámbito, para que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evite pagar todo el coste de inicio del proyecto raíz.
    - `pnpm test:changed` amplía de forma predeterminada las rutas modificadas de git en carriles con ámbito de bajo coste: modificaciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y dependientes del grafo de importaciones local. Las modificaciones de configuración, preparación o paquetes no ejecutan pruebas de forma amplia, salvo que se utilice explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta normal de comprobación local inteligente para trabajos acotados. Clasifica las diferencias en núcleo, pruebas del núcleo, extensiones, pruebas de extensiones, aplicaciones, documentación, metadatos de versiones, herramientas de Docker en vivo y herramientas generales, y después ejecuta los comandos de comprobación de tipos, lint y protección correspondientes. No ejecuta pruebas de Vitest; se debe invocar `pnpm test:changed` o un `pnpm test <target>` explícito para obtener evidencia de las pruebas. Los incrementos de versión que solo modifican metadatos de versiones ejecutan comprobaciones específicas de versión, configuración y dependencias raíz, con una protección que rechaza cambios en paquetes fuera del campo de versión de nivel superior.
    - Las modificaciones del arnés ACP de Docker en vivo ejecutan comprobaciones específicas: sintaxis de shell para los scripts de autenticación de Docker en vivo y una simulación del planificador de Docker en vivo. Los cambios de `package.json` solo se incluyen cuando las diferencias se limitan a `scripts["test:docker:live-*"]`; las modificaciones de dependencias, exportaciones, versiones y otras superficies del paquete siguen utilizando las protecciones más amplias.
    - Las pruebas unitarias con pocas importaciones de agentes, comandos, plugins, auxiliares de respuesta automática, `plugin-sdk` y áreas similares de utilidades puras se dirigen por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o que consumen muchos recursos de ejecución permanecen en los carriles existentes.
    - Determinados archivos fuente auxiliares de `plugin-sdk` y `commands` también asignan las ejecuciones en modo de cambios a pruebas hermanas explícitas de esos carriles ligeros, por lo que las modificaciones de auxiliares evitan volver a ejecutar todo el conjunto pesado de ese directorio.
    - `auto-reply` dispone de grupos dedicados para los auxiliares del núcleo de nivel superior, las pruebas de integración de `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. La CI divide además el subárbol de respuestas en fragmentos de ejecutor de agentes, despacho y comandos/enrutamiento de estado, para que un único grupo con muchas importaciones no controle toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de plugins incluidos y el fragmento `agentic-plugins`, exclusivo de versiones. La Validación completa de la versión inicia el flujo de trabajo secundario `Plugin Prerelease` independiente para esos conjuntos con muchos plugins en las versiones candidatas.

  </Accordion>

  <Accordion title="Cobertura del ejecutor integrado">

    - Al modificar las entradas de detección de herramientas de mensajes o el contexto de ejecución de Compaction,
      se deben mantener ambos niveles de cobertura.
    - Se deben añadir regresiones específicas de auxiliares para los límites puros
      de enrutamiento y normalización.
    - Se deben mantener en buen estado los conjuntos de integración del ejecutor integrado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` y
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Esos conjuntos verifican que los identificadores con ámbito y el comportamiento de Compaction sigan fluyendo
      por las rutas reales `run.ts` / `compact.ts`; las pruebas limitadas a auxiliares
      no sustituyen de forma suficiente esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados del grupo y el aislamiento de Vitest">

    - La configuración base de Vitest utiliza `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y utiliza el
      ejecutor no aislado en los proyectos raíz y las configuraciones e2e y en vivo.
    - El carril de la interfaz de usuario raíz conserva su preparación y optimizador de `jsdom`, pero también se ejecuta
      en el ejecutor compartido no aislado.
    - Cada fragmento `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade de forma predeterminada `--no-maglev` a los procesos secundarios de Node
      de Vitest para reducir la repetición de compilaciones de V8 durante ejecuciones locales grandes.
      Se puede establecer `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar con el comportamiento
      estándar de V8.
    - `scripts/run-vitest.mjs` finaliza las ejecuciones explícitas de Vitest sin vigilancia
      después de 5 minutos sin salida en stdout ni stderr. Se puede establecer
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desactivar el supervisor durante
      una investigación intencionadamente silenciosa.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa una diferencia.
    - El enlace de preconfirmación solo aplica formato. Vuelve a preparar los archivos formateados
      y no ejecuta lint, comprobación de tipos ni pruebas.
    - Se debe ejecutar `pnpm check:changed` explícitamente antes de la entrega o el envío cuando
      se necesite la puerta de comprobación local inteligente.
    - `pnpm test:changed` se dirige de forma predeterminada por carriles con ámbito de bajo coste. Se debe utilizar
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` únicamente cuando el agente
      determine que una modificación del arnés, la configuración, un paquete o un contrato necesita realmente
      una cobertura de Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento,
      pero con un límite de trabajadores mayor.
    - El escalado automático de trabajadores locales es intencionadamente conservador y se reduce
      cuando el promedio de carga del host ya es alto, de modo que varias ejecuciones
      simultáneas de Vitest causen menos perjuicios de forma predeterminada.
    - La configuración base de Vitest marca los archivos de proyectos/configuración como
      `forceRerunTriggers` para que las repeticiones en modo de cambios sigan siendo correctas cuando cambie
      la conexión de las pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en
      hosts compatibles; se puede establecer `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      para indicar una única ubicación explícita de caché para el perfilado directo.

  </Accordion>

  <Accordion title="Depuración del rendimiento">

    - `pnpm test:perf:imports` habilita los informes de duración de importaciones de Vitest y
      la salida del desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a
      los archivos modificados desde `origin/main`.
    - Los datos de tiempos de los fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de toda la configuración utilizan la ruta de configuración como clave; los fragmentos de CI
      con patrones de inclusión añaden el nombre del fragmento para poder supervisar por separado
      los fragmentos filtrados.
    - Cuando una prueba problemática sigue dedicando la mayor parte del tiempo a importaciones de inicio,
      se deben mantener las dependencias pesadas detrás de una interfaz local estrecha de `*.runtime.ts` y
      simular directamente esa interfaz, en lugar de importar en profundidad auxiliares de ejecución
      solo para pasarlos mediante `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` dirigido con la ruta nativa del proyecto raíz para esas
      diferencias confirmadas e imprime el tiempo real transcurrido y el RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el rendimiento del
      árbol de trabajo actual con cambios dirigiendo la lista de archivos modificados mediante
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      los costes de inicio y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU y memoria dinámica del ejecutor para
      el conjunto unitario con el paralelismo de archivos desactivado.

  </Accordion>
</AccordionGroup>

### Estabilidad (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` y `test/vitest/vitest.infra.config.ts`, cada una limitada a un trabajador
- Ámbito:
  - Inicia un Gateway de bucle invertido real con los diagnósticos habilitados de forma predeterminada
  - Genera actividad sintética de mensajes, memoria y cargas útiles grandes del Gateway mediante la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante el RPC WS del Gateway
  - Abarca los auxiliares de persistencia del paquete de estabilidad de diagnósticos
  - Comprueba que el registrador permanezca limitado, que las muestras sintéticas de RSS se mantengan por debajo del presupuesto de presión y que las profundidades de las colas por sesión vuelvan a cero
- Expectativas:
  - Apto para CI y sin claves
  - Carril acotado para el seguimiento de regresiones de estabilidad, no sustituye al conjunto completo del Gateway

### E2E (agregado del repositorio)

- Comando: `pnpm test:e2e`
- Ámbito:
  - Ejecuta el carril E2E de prueba rápida del Gateway
  - Ejecuta el carril E2E del navegador con simulación de la interfaz de control
- Expectativas:
  - Apto para CI y sin claves
  - Requiere que Chromium de Playwright esté instalado

### E2E (prueba rápida del Gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuración: `test/vitest/vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y pruebas E2E de plugins incluidos en `extensions/`
- Valores predeterminados de ejecución:
  - Utiliza `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Utiliza trabajadores adaptativos (CI: hasta 2; local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir el coste de E/S de la consola.
- Modificaciones útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de trabajadores (con un límite de 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de la consola.
- Ámbito:
  - Comportamiento integral de varias instancias del Gateway
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más exigentes
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Tiene más componentes móviles que las pruebas unitarias (puede ser más lento)

### E2E (navegador simulado de la interfaz de control)

- Comando: `pnpm test:ui:e2e`
- Configuración: `test/vitest/vitest.ui-e2e.config.ts`
- Archivos: `ui/src/**/*.e2e.test.ts`
- Ámbito:
  - Inicia la interfaz de control de Vite
  - Controla una página real de Chromium mediante Playwright
  - Sustituye el WebSocket del Gateway por simulaciones deterministas en el navegador
- Expectativas:
  - Se ejecuta en CI como parte de `pnpm test:e2e`
  - No requiere un Gateway, agentes ni claves de proveedores reales
  - La dependencia del navegador debe estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: prueba rápida del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Ámbito:
  - Reutiliza un Gateway OpenShell local activo
  - Crea un entorno aislado a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw mediante `sandbox ssh-config` real y ejecución por SSH
  - Verifica el comportamiento canónico remoto del sistema de archivos mediante el puente del sistema de archivos del entorno aislado
- Expectativas:
  - Solo con activación voluntaria; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI `openshell` local y un daemon de Docker operativo
  - Requiere un Gateway OpenShell local activo y su fuente de configuración
  - Utiliza `HOME` / `XDG_CONFIG_HOME` aislados y después destruye el entorno aislado de prueba
- Modificaciones útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente el conjunto e2e más amplio
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario de CLI o script contenedor no predeterminado
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para exponer la configuración registrada del Gateway a la prueba aislada
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para sustituir la IP del Gateway de Docker utilizada por la configuración de pruebas de la política del host

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `test/vitest/vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos en `extensions/`
- Valor predeterminado: **habilitado** mediante `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - «¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?»
  - Detectar cambios de formato del proveedor, particularidades de las llamadas a herramientas, problemas de autenticación y comportamiento de los límites de tasa
- Expectativas:
  - No ofrece estabilidad de CI por diseño (redes reales, políticas reales de los proveedores, cuotas e interrupciones)
  - Cuesta dinero o consume límites de tasa
  - Es preferible ejecutar subconjuntos acotados en lugar de «todo»
- Las ejecuciones en vivo usan claves de API ya exportadas y perfiles de autenticación preparados.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian el material de configuración y autenticación en un directorio de inicio temporal de pruebas para que los recursos de pruebas unitarias no puedan modificar el `~/.openclaw` real.
- Establezca `OPENCLAW_LIVE_USE_REAL_HOME=1` únicamente cuando necesite intencionadamente que las pruebas en vivo usen el directorio de inicio real.
- `pnpm test:live` usa de forma predeterminada un modo más silencioso: conserva la salida de progreso de `[live] ...` y silencia los registros de arranque del Gateway y los mensajes de Bonjour. Establezca `OPENCLAW_LIVE_TEST_QUIET=0` si desea recuperar todos los registros de inicio.
- Rotación de claves de API (específica del proveedor): establezca `*_API_KEYS` con formato separado por comas o puntos y coma, o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), o una sustitución por ejecución en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas vuelven a intentarlo ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites en vivo emiten líneas de progreso en stderr para que las llamadas prolongadas a proveedores se muestren visiblemente activas incluso cuando la captura de consola de Vitest está en silencio.
  - `test/vitest/vitest.live.config.ts` deshabilita la interceptación de la consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajuste los Heartbeats de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste los Heartbeats del Gateway y de las sondas con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite se debe ejecutar?

Use esta tabla de decisión:

- Edición de lógica/pruebas: ejecute `pnpm test` (y `pnpm test:coverage` si ha cambiado muchas cosas)
- Cambios en la red del Gateway, el protocolo WS o el emparejamiento: añada `pnpm test:e2e`
- Depuración de «mi bot no funciona», errores específicos de un proveedor o llamadas a herramientas: ejecute un `pnpm test:live` acotado

## Pruebas en vivo (con acceso a la red)

Para la matriz de modelos en vivo, las pruebas de humo del backend de la CLI, las pruebas de humo de ACP, el entorno de pruebas del servidor de aplicaciones de Codex y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI, imagen, música, vídeo y entorno multimedia), además de la gestión de credenciales para las ejecuciones en vivo,

- consulte [Pruebas de suites en vivo](/es/help/testing-live). Para consultar la lista de comprobación específica de validación de actualizaciones y
  plugins, consulte
  [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores de Docker (comprobaciones opcionales de «funciona en Linux»)

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan únicamente el archivo en vivo correspondiente a su clave de perfil dentro de la imagen de Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando el directorio de configuración local, el espacio de trabajo y el archivo opcional de entorno del perfil. Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores en vivo de Docker mantienen sus propios límites prácticos cuando es necesario:
  `test:docker:live-models` usa de forma predeterminada el conjunto seleccionado de alta señal compatible, y
  `test:docker:live-gateway` usa de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Establezca `OPENCLAW_LIVE_MAX_MODELS`
  o las variables de entorno del Gateway cuando desee explícitamente un límite menor o un análisis más amplio.
- `test:docker:all` compila una vez la imagen de Docker en vivo mediante `test:docker:live-build`, empaqueta OpenClaw una vez como archivo tar de npm mediante `scripts/package-openclaw-for-docker.mjs` y, a continuación, compila o reutiliza dos imágenes `scripts/e2e/Dockerfile`. La imagen básica es únicamente el ejecutor de Node/Git para las vías de instalación, actualización y dependencias de plugins; estas vías montan el archivo tar precompilado. La imagen funcional instala el mismo archivo tar en `/app` para las vías de funcionalidad de la aplicación compilada. Las definiciones de las vías de Docker se encuentran en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador se encuentra en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El conjunto usa un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla los espacios de procesos, mientras que los límites de recursos impiden que las vías pesadas en vivo, de instalación de npm y multiservicio se inicien todas a la vez. Si una sola vía consume más recursos que los límites activos, el planificador puede iniciarla cuando el grupo esté vacío y mantenerla ejecutándose en solitario hasta que vuelva a haber capacidad disponible. Los valores predeterminados son 10 espacios, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (y otras sustituciones de `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) únicamente cuando el host de Docker disponga de más capacidad. El ejecutor realiza de forma predeterminada una comprobación previa de Docker, elimina los contenedores E2E obsoletos de OpenClaw, muestra el estado cada 30 segundos, almacena los tiempos de las vías correctas en `.artifacts/docker-tests/lane-timings.json` y usa esos tiempos para iniciar primero las vías más largas en ejecuciones posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para mostrar el manifiesto ponderado de vías sin compilar ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para mostrar el plan de CI de las vías seleccionadas, las necesidades de paquetes/imágenes y las credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para comprobar «¿funciona como producto este archivo tar instalable?». Resuelve un paquete candidato de `source=npm`, `source=ref`, `source=url`, `source=trusted-url` o `source=artifact`, lo carga como `package-under-test` y, a continuación, ejecuta las vías E2E reutilizables de Docker con ese archivo tar exacto en lugar de volver a empaquetar la referencia seleccionada. Los perfiles se ordenan por amplitud: `smoke`, `package`, `product` y `full` (además de `custom` para una lista explícita de vías). Consulte [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins) para conocer el contrato de paquetes/actualizaciones/plugins, la matriz de supervivencia de actualizaciones publicadas, los valores predeterminados de las versiones y el diagnóstico de errores.
- Las comprobaciones de compilación y publicación ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js` y falla si dicho grafo de arranque previo al despacho importa estáticamente algún paquete externo (Commander, interfaz de avisos, undici, registro y dependencias similares que ralentizan el inicio cuentan) antes del despacho de comandos; también limita a 70 KB el fragmento empaquetado de ejecución del Gateway y rechaza las importaciones estáticas de rutas inactivas conocidas del Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) desde ese fragmento. `scripts/release-check.ts` prueba por separado mediante pruebas de humo la CLI empaquetada con `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` y `models list --provider openai`.
- La compatibilidad heredada de Aceptación de paquetes está limitada a `2026.4.25` (`2026.4.25-beta.*` incluido). Hasta ese límite, el entorno de pruebas solo tolera las carencias de metadatos de paquetes publicados: entradas omitidas del inventario privado de QA, ausencia de `gateway install --wrapper`, archivos de parche ausentes en el recurso de Git derivado del archivo tar, ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, ausencia de persistencia de registros de instalación del mercado y migración de metadatos de configuración durante `plugins update`. Para paquetes posteriores a `2026.4.25`, esas rutas producen errores estrictos.
- Ejecutores de pruebas de humo en contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` inician uno o varios contenedores reales y verifican rutas de integración de nivel superior.
- Las vías E2E de Docker/Bash que instalan el archivo tar empaquetado de OpenClaw mediante `scripts/lib/openclaw-e2e-instance.sh` limitan `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (valor predeterminado: `600s`; establezca `0` para deshabilitar el envoltorio durante la depuración).

Los ejecutores de Docker de modelos en vivo también montan mediante vinculación únicamente los directorios de autenticación de la CLI necesarios
(o todos los compatibles cuando la ejecución no está acotada) y después los copian en el
directorio de inicio del contenedor antes de la ejecución para que OAuth de la CLI externa pueda actualizar los tokens
sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba de humo de vinculación de ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; abarca Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba de humo del backend de la CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba de humo del entorno del servidor de aplicaciones de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Pruebas de humo de observabilidad: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` y `pnpm qa:observability:smoke` son vías privadas de QA para el código fuente desprotegido. Intencionadamente, no forman parte de las vías de publicación de paquetes de Docker porque el archivo tar de npm omite QA Lab.
- Prueba de humo en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, estructura completa): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba de humo de incorporación/canal/agente del archivo tar de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente el archivo tar empaquetado de OpenClaw en Docker, configura OpenAI mediante una incorporación con referencia de entorno y Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno de agente de OpenAI simulado. Reutilice un archivo tar precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la recompilación en el host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambie de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Prueba rápida del recorrido de usuario de la versión: `pnpm test:docker:release-user-journey` instala globalmente el tarball empaquetado de OpenClaw en un directorio de inicio limpio de Docker, ejecuta la incorporación, configura un proveedor de OpenAI simulado, ejecuta un turno de agente, instala y desinstala plugins externos, configura ClickClack con un fixture local, verifica la mensajería saliente y entrante, reinicia el Gateway y ejecuta doctor.
- Prueba rápida de incorporación tipada de la versión: `pnpm test:docker:release-typed-onboarding` instala el tarball empaquetado, controla `openclaw onboard` mediante una TTY real, configura OpenAI como proveedor con referencia de entorno, verifica que no se conserve ninguna clave sin procesar y ejecuta un turno de agente simulado.
- Prueba rápida de medios/memoria de la versión: `pnpm test:docker:release-media-memory` instala el tarball empaquetado y verifica la comprensión de imágenes a partir de un archivo PNG adjunto, la salida de generación de imágenes compatible con OpenAI, la recuperación mediante búsqueda en memoria y la conservación de la recuperación tras reiniciar el Gateway.
- Prueba rápida del recorrido de usuario de actualización de la versión: `pnpm test:docker:release-upgrade-user-journey` instala de forma predeterminada la versión base publicada más reciente anterior al tarball candidato, configura el estado del proveedor, el plugin y ClickClack en el paquete publicado, actualiza al tarball candidato y vuelve a ejecutar el recorrido principal de agente, plugin y canal. Si no existe una versión base publicada anterior, reutiliza la versión candidata. Sustituya la versión base con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Prueba rápida del marketplace de plugins de la versión: `pnpm test:docker:release-plugin-marketplace` instala desde un marketplace de fixtures local, actualiza el plugin instalado, lo desinstala y verifica que la CLI del plugin desaparezca y se eliminen los metadatos de instalación.
- Prueba rápida de instalación de Skills: `pnpm test:docker:skill-install` instala globalmente el tarball empaquetado de OpenClaw en Docker, desactiva en la configuración las instalaciones de archivos cargados, obtiene mediante búsqueda el slug actual de la skill activa de ClawHub, la instala con `openclaw skills install` y verifica la skill instalada junto con los metadatos de origen/bloqueo de `.clawhub`.
- Prueba rápida de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia del paquete `stable` al git `dev`, verifica el canal conservado y el funcionamiento del plugin posterior a la actualización, vuelve después al paquete `stable` y comprueba el estado de actualización.
- Prueba rápida de supervivencia a la actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture antiguo y modificado de usuario con agentes, configuración de canales, listas de permitidos de plugins, estado obsoleto de dependencias de plugins y archivos existentes de espacio de trabajo/sesión. Ejecuta la actualización del paquete y doctor de forma no interactiva sin claves activas de proveedor ni canal; después inicia un Gateway de bucle invertido y comprueba la conservación de la configuración y el estado, además de los límites de inicio y estado.
- Prueba rápida publicada de supervivencia a la actualización: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, inicializa archivos realistas de un usuario existente, configura esa versión base mediante una receta de comandos incorporada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor de forma no interactiva, escribe `.artifacts/upgrade-survivor/summary.json`, inicia después un Gateway de bucle invertido y comprueba las intenciones configuradas, la conservación del estado, el inicio, `/healthz`, `/readyz` y los límites de estado de RPC. Sustituya una versión base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, solicite al planificador agregado que expanda versiones base locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y que expanda fixtures basados en incidencias con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; el conjunto de incidencias notificadas incluye `configured-plugin-installs` para la reparación automática de la instalación de plugins externos de OpenClaw. Package Acceptance los expone como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de metaversión base como `last-stable-4` o `all-since-2026.4.23`, y Full Release Validation expande la comprobación del paquete de estabilización de la versión a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` más `reported-issues`.
- Prueba rápida del contexto de ejecución de sesión: `pnpm test:docker:session-runtime-context` verifica la conservación oculta de la transcripción del contexto de ejecución y la reparación mediante doctor de las ramas duplicadas afectadas de reescritura de prompts.
- Prueba rápida de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un directorio de inicio aislado y verifica que `openclaw infer image providers --json` devuelva los proveedores de imágenes incluidos en lugar de bloquearse. Reutilice un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copie `dist/` desde una imagen de Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba rápida del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores raíz, de actualización y de npm directo. De forma predeterminada, la prueba rápida de actualización utiliza npm `latest` como versión base estable antes de actualizar al tarball candidato. Sustitúyala localmente con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` o en GitHub mediante la entrada `update_baseline_version` del flujo de trabajo Install Smoke. Las comprobaciones del instalador sin privilegios de raíz mantienen una caché de npm aislada para que las entradas de caché propiedad de root no oculten el comportamiento de la instalación local del usuario. Establezca `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché raíz/de actualización/de npm directo entre ejecuciones locales.
- La CI de Install Smoke omite la actualización global duplicada mediante npm directo con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecute el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Prueba rápida de la CLI para que los agentes eliminen un espacio de trabajo compartido: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen del Dockerfile raíz, inicializa dos agentes con un espacio de trabajo en un directorio de inicio aislado del contenedor, ejecuta `agents delete --json` y verifica un JSON válido junto con el comportamiento de conservación del espacio de trabajo. Reutilice la imagen de la prueba rápida de instalación con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes del Gateway y ciclo de vida del host: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`) conserva la prueba rápida de autenticación/estado de WebSocket en la LAN entre dos contenedores y, después, usa HTTP de administración mediante bucle invertido para demostrar el bloqueo de preparación, el acceso con control conservado, la recuperación mediante reanudación y una parada/inicio preparados dentro del mismo contenedor. La comprobación del reinicio debe finalizar antes de que caduque la concesión original, verifica que el estado de suspensión sea local al proceso mientras se conservan la configuración persistente del Gateway y la identidad del contenedor, y emite un JSON legible por máquina con los tiempos de cada fase.
- Prueba rápida de instantáneas CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E de origen junto con una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles de CDP abarquen las URL de los enlaces, los elementos en los que se puede hacer clic promovidos por el cursor, las referencias de iframe y los metadatos de los marcos.
- Regresión de razonamiento mínimo de web_search en OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado mediante el Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, fuerza después el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros del Gateway.
- Puente de canales MCP (Gateway inicializado + puente stdio + prueba rápida de marcos de notificación de Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete de OpenClaw (servidor MCP stdio real + prueba rápida de permitir/denegar del perfil integrado de OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpieza MCP de Cron/subagentes (Gateway real + cierre de procesos MCP stdio secundarios tras ejecuciones aisladas de Cron y ejecuciones únicas de subagentes): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba rápida de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, metadatos de paquete npm mal formados, referencias móviles de git, conjunto integral de ClawHub, actualizaciones del marketplace y activación/inspección del paquete de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Establezca `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub o sustituya el par predeterminado de paquete/entorno de ejecución integral con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba utiliza un servidor de fixtures local y hermético de ClawHub.
- Prueba rápida de actualización sin cambios de plugins: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba rápida de la matriz del ciclo de vida de plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor básico, instala un plugin de npm, alterna su activación y desactivación, lo actualiza y revierte a una versión anterior mediante un registro npm local, elimina el código instalado y verifica después que la desinstalación siga eliminando el estado obsoleto mientras registra métricas de RSS/CPU para cada fase del ciclo de vida.
- Prueba rápida de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` abarca la prueba rápida de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, referencias móviles de git, fixtures de ClawHub, actualizaciones del marketplace y activación/inspección del paquete de Claude. `pnpm test:docker:plugin-update` abarca el comportamiento de actualización sin cambios de los plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` abarca la instalación de plugins de npm con seguimiento de recursos, su activación, desactivación, actualización, reversión a una versión anterior y desinstalación cuando falta el código.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sustituciones de imagen específicas de cada suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando se establecen. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen compartida remota, los scripts la descargan si todavía no está disponible localmente. Las pruebas de QR y del instalador en Docker mantienen sus propios Dockerfiles porque validan el comportamiento del paquete y la instalación, no el entorno de ejecución compartido de la aplicación compilada.

Los ejecutores de Docker con modelos activos también montan el repositorio de trabajo actual como de solo lectura
y lo preparan en un directorio de trabajo temporal dentro del contenedor. De este modo, la
imagen del entorno de ejecución se mantiene ligera y Vitest se sigue ejecutando con el código fuente y la configuración
locales exactos. El paso de preparación omite las cachés grandes de uso exclusivamente local y los resultados de compilación
de aplicaciones, como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, y
los directorios locales de `.build` o de resultados de Gradle, para que las ejecuciones activas en Docker no
dediquen minutos a copiar artefactos específicos de la máquina. También establecen
`OPENCLAW_SKIP_CHANNELS=1` para que las sondas activas del Gateway no inicien procesos reales de
canales de Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, por lo que también debe transmitir
`OPENCLAW_LIVE_GATEWAY_*` cuando sea necesario limitar o excluir la cobertura activa del
Gateway en esa vía de Docker.

`test:docker:openwebui` es una prueba rápida de compatibilidad de nivel superior: inicia un
contenedor del Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI activados,
inicia un contenedor fijado de Open WebUI conectado a ese Gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y después envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI. Establezca
`OPENWEBUI_SMOKE_MODE=models` para las comprobaciones de CI de la ruta de versión que deban detenerse
tras el inicio de sesión y la detección de modelos en Open WebUI, sin esperar a que finalice
un modelo activo. La primera ejecución puede ser notablemente más lenta porque Docker quizá deba
descargar la imagen de Open WebUI y Open WebUI quizá deba completar su propia
configuración de arranque en frío. Esta vía requiere una clave utilizable de un modelo activo, proporcionada mediante
el entorno del proceso, perfiles de autenticación preparados o un
`OPENCLAW_PROFILE_FILE` explícito. Las ejecuciones correctas imprimen una pequeña carga útil JSON como
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` es deliberadamente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Inicia un contenedor del Gateway
preconfigurado, inicia un segundo contenedor que genera `openclaw mcp serve` y después
verifica la detección de conversaciones enrutadas, la lectura de transcripciones, los metadatos
de archivos adjuntos, el comportamiento de la cola de eventos en directo, el enrutamiento de envíos salientes y las notificaciones
de canal y permisos al estilo de Claude mediante el puente MCP stdio real. La
comprobación de notificaciones inspecciona directamente los marcos MCP stdio sin procesar para que la prueba rápida
valide lo que realmente emite el puente, no solo lo que muestra un SDK
de cliente específico.

`test:docker:agent-bundle-mcp-tools` es determinista y no necesita una
clave de modelo activa. Compila la imagen Docker del repositorio, inicia un servidor de
sondeo MCP stdio real dentro del contenedor, materializa ese servidor mediante el
entorno de ejecución MCP del paquete integrado de OpenClaw, ejecuta la herramienta y, después, verifica
que `coding` y `messaging` mantienen las herramientas de `bundle-mcp`, mientras que `minimal` y
`tools.deny: ["bundle-mcp"]` las filtran.

`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de
modelo activa. Inicia un Gateway con datos preconfigurados y un servidor de sondeo MCP stdio real,
ejecuta un turno de Cron aislado y un turno secundario único de `sessions_spawn` y, después,
verifica que el proceso secundario de MCP finaliza tras cada ejecución.

Prueba de humo manual de hilos ACP en lenguaje natural (no pertenece a CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserve este script para los flujos de trabajo de regresión y depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, así que no lo elimine.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (valor predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (valor predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` se monta y carga antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar únicamente las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, mediante directorios temporales de configuración y espacio de trabajo, sin montajes externos de autenticación de la CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (valor predeterminado: `~/.cache/openclaw/docker-cli-tools`, salvo que la ejecución ya utilice un directorio de enlace administrado o de CI) montado en `/home/node/.npm-global` para almacenar en caché las instalaciones de la CLI dentro de Docker
- Los directorios y archivos externos de autenticación de la CLI en `$HOME` se montan en modo de solo lectura en `/host-auth...` y, después, se copian en `/home/node/...` antes de iniciar las pruebas
  - Directorios predeterminados (utilizados cuando la ejecución no se limita a proveedores específicos): `.factory`, `.gemini`, `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones limitadas a determinados proveedores solo montan los directorios y archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescriba esta configuración manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en ejecuciones repetidas que no requieran una recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales procedan del almacén de perfiles (y no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo que el Gateway expone para la prueba de humo de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescribir la instrucción de comprobación del nonce utilizada por la prueba de humo de Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescribir la etiqueta fijada de la imagen de Open WebUI

## Comprobación de coherencia de la documentación

Ejecute las comprobaciones de documentación después de modificarla: `pnpm check:docs`.
Ejecute la validación completa de anclajes de Mintlify cuando también necesite comprobar los encabezados dentro de las páginas: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones del «pipeline real» sin proveedores reales:

- Llamadas a herramientas del Gateway (OpenAI simulado, Gateway real + bucle del agente): `src/gateway/gateway.test.ts` (caso: «ejecuta de extremo a extremo una llamada simulada de OpenAI a una herramienta mediante el bucle del agente del Gateway»)
- Asistente del Gateway (`wizard.start`/`wizard.next` de WS, escribe la configuración + autenticación obligatoria): `src/gateway/gateway.test.ts` (caso: «ejecuta el asistente mediante WebSocket y escribe la configuración del token de autenticación»)

## Evaluaciones de fiabilidad del agente (Skills)

Ya existen algunas pruebas seguras para CI que funcionan como «evaluaciones de fiabilidad del agente»:

- Llamadas simuladas a herramientas mediante el Gateway real y el bucle del agente (`src/gateway/gateway.test.ts`).
- Flujos de extremo a extremo del asistente que validan la conexión de sesiones y los efectos de la configuración (`src/gateway/gateway.test.ts`).

Lo que todavía falta para Skills (consulte [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando se enumeran Skills en la instrucción, ¿selecciona el agente la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿lee el agente `SKILL.md` antes de utilizarla y sigue los pasos y argumentos obligatorios?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que comprueben el orden de las herramientas, la conservación del historial de sesión y los límites del entorno aislado.

Las evaluaciones futuras deben priorizar el determinismo:

- Un ejecutor de escenarios que utilice proveedores simulados para comprobar las llamadas a herramientas y su orden, las lecturas de archivos de Skills y la conexión de sesiones.
- Un pequeño conjunto de escenarios centrados en Skills (uso frente a omisión, restricciones, inyección de instrucciones).
- Evaluaciones activas opcionales (participación voluntaria, condicionadas mediante variables de entorno) solo después de disponer del conjunto seguro para CI.

## Pruebas de contrato (estructura de plugins y canales)

Las pruebas de contrato verifican que cada Plugin y canal registrado cumpla
su contrato de interfaz. Recorren todos los plugins detectados y ejecutan un
conjunto de comprobaciones de estructura y comportamiento. La vía de pruebas unitarias predeterminada `pnpm test`
omite intencionadamente estos archivos compartidos de límites y pruebas de humo; ejecute los comandos
de contrato de forma explícita cuando modifique superficies compartidas de canales o proveedores.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo los contratos de canales: `pnpm test:contracts:channels`
- Solo los contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Se encuentran en `src/channels/plugins/contracts/*.contract.test.ts`. Categorías actuales
de nivel superior:

- **channel-catalog**: metadatos de las entradas del catálogo de canales integrados/del registro
- **plugin** (basado en el registro, fragmentado): estructura básica de registro de plugins
- **surfaces-only** (basado en el registro, fragmentado): comprobaciones de estructura por superficie para `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` y `gateway`
- **session-binding** (basado en el registro): comportamiento de asociación de sesiones
- **outbound-payload**: estructura y normalización de la carga útil de los mensajes
- **group-policy** (alternativa): aplicación de la política de grupos predeterminada por canal
- **threading** (basado en el registro, fragmentado): gestión de identificadores de hilos
- **directory** (basado en el registro, fragmentado): API de directorio/lista de miembros
- **registry** y **plugins-core.\***: registro de plugins de canales, cargador y aspectos internos de autorización para escribir la configuración

Los auxiliares del entorno de pruebas de captura de distribución entrante y carga útil saliente utilizados por estos
conjuntos se exponen internamente mediante `src/plugin-sdk/channel-contract-testing.ts`
(excluido de npm, no es una subruta pública del SDK); no existe ningún archivo
`inbound.contract.test.ts` independiente en este directorio.

### Contratos de proveedores

Se encuentran en `src/plugins/contracts/*.contract.test.ts`. Las categorías actuales
incluyen:

- **shape**: estructura del manifiesto, la API y las exportaciones del entorno de ejecución del Plugin
- **plugin-registration** (+ paralelo): casos de registro de manifiestos
- **package-manifest**: requisitos del manifiesto del paquete
- **loader**: comportamiento de inicialización/desmontaje del cargador de plugins
- **registry**: contenido y búsqueda en el registro de contratos de plugins
- **providers**: comportamiento compartido de los proveedores integrados, además de los proveedores de búsqueda web
- **auth-choice**: metadatos de elección de autenticación y comportamiento de configuración
- **provider-catalog-deprecation**: metadatos obsoletos del catálogo de proveedores
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options**: contratos del asistente de configuración de proveedores
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts**: contratos de proveedores específicos de cada capacidad
- **session-actions**, **session-attachments**, **session-entry-projection**: contratos del estado de sesión que pertenecen al Plugin
- **scheduled-turns**: metadatos de turnos programados del Plugin y límites de las marcas de tiempo
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams**: contratos del ciclo de vida del host/entorno de ejecución del Plugin y de los límites de importación
- **extension-runtime-dependencies**: ubicación de las dependencias del entorno de ejecución para las extensiones

### Cuándo ejecutarlas

- Después de modificar las exportaciones o subrutas del SDK de plugins
- Después de añadir o modificar un Plugin de canal o proveedor
- Después de refactorizar el registro o la detección de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Adición de regresiones (orientación)

Cuando se corrija un problema de un proveedor/modelo detectado en una ejecución activa:

- Añada una regresión segura para CI si es posible (proveedor simulado o stub, o capture la transformación exacta de la estructura de la solicitud)
- Si por naturaleza solo se puede probar en activo (límites de frecuencia, políticas de autenticación), mantenga la prueba activa acotada y habilítela voluntariamente mediante variables de entorno
- Priorice la capa más pequeña que permita detectar el error:
  - error de conversión/reproducción de solicitudes del proveedor -> prueba directa de modelos
  - error en el pipeline de sesión/historial/herramientas del Gateway -> prueba de humo activa del Gateway o prueba simulada del Gateway segura para CI
- Protección contra el recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` obtiene un destino de muestra por cada clase de SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`) y, después, comprueba que se rechacen los identificadores de ejecución con segmentos de recorrido.
  - Si añade una nueva familia de destinos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualice `classifyTargetClass` en esa prueba. La prueba falla intencionadamente con los identificadores de destino no clasificados para impedir que se omitan silenciosamente clases nuevas.

## Temas relacionados

- [Pruebas en activo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
