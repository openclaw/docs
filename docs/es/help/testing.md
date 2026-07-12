---
read_when:
    - Ejecución de pruebas de forma local o en CI
    - Adición de pruebas de regresión para errores de modelos/proveedores
    - Depuración del comportamiento del Gateway y del agente
summary: 'Kit de pruebas: conjuntos de pruebas unitarias, e2e y en vivo, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-07-12T14:35:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tiene tres suites de Vitest (unitaria/integración, e2e, en vivo), además de
ejecutores de Docker. Esta página explica qué abarca cada suite, qué comando ejecutar para un
flujo de trabajo determinado, cómo las pruebas en vivo detectan las credenciales y cómo añadir
regresiones para errores reales de proveedores/modelos.

<Note>
La **pila de control de calidad (qa-lab, qa-channel y canales de transporte en vivo)** se documenta por separado:

- [Descripción general del control de calidad](/es/concepts/qa-e2e-automation) - arquitectura, superficie de comandos y creación de escenarios.
- [Control de calidad de Matrix](/es/concepts/qa-matrix) - referencia para `pnpm openclaw qa matrix`.
- [Cuadro de evaluación de madurez](/es/maturity/scorecard) - cómo la evidencia del control de calidad de versiones respalda las decisiones de estabilidad y LTS.
- [Canal de control de calidad](/es/channels/qa-channel) - el plugin de transporte sintético utilizado por los escenarios respaldados por el repositorio.

Esta página abarca las suites de pruebas habituales y los ejecutores de Docker/Parallels. La sección [Ejecutores específicos de control de calidad](#qa-specific-runners) que aparece más adelante enumera las invocaciones concretas de `qa` y remite a las referencias anteriores.
</Note>

## Inicio rápido

La mayoría de los días:

- Comprobación completa (requerida antes de subir cambios): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con recursos suficientes: `pnpm test:max`
- Bucle de observación directa de Vitest: `pnpm test:watch`
- La selección directa de archivos también dirige las rutas de plugins/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Al iterar sobre un único fallo, se recomienda comenzar con ejecuciones específicas.
- Sitio de control de calidad respaldado por Docker: `pnpm qa:lab:up`
- Canal de control de calidad respaldado por una máquina virtual Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Al modificar pruebas o buscar mayor confianza:

- Informe informativo de cobertura de V8: `pnpm test:coverage`
- Suite e2e: `pnpm test:e2e`

## Directorios temporales de pruebas

Utilice las funciones auxiliares compartidas de `test/helpers/temp-dir.ts` para los directorios
temporales pertenecientes a las pruebas, de modo que la propiedad sea explícita y la limpieza
permanezca dentro del ciclo de vida de la prueba:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("utiliza un espacio de trabajo temporal", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // utilizar el espacio de trabajo
});
```

`useAutoCleanupTempDirTracker(afterEach)` no expone intencionadamente ningún método de
limpieza manual: Vitest se encarga de la limpieza después de cada prueba. Las funciones auxiliares
anteriores de nivel inferior (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) siguen existiendo
para las pruebas que aún no se han migrado; evite utilizarlas en código nuevo y evite nuevas llamadas
directas a `fs.mkdtemp*`, salvo que una prueba verifique explícitamente el comportamiento sin procesar
de los directorios temporales. Cuando sea realmente necesario un directorio temporal directo, añada
un comentario de autorización auditable con el motivo:

```ts
// openclaw-temp-dir: allow verifica el comportamiento de limpieza sin procesar de fs
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` informa de nuevas creaciones directas de directorios
temporales y de nuevos usos manuales de funciones auxiliares compartidas en las líneas añadidas del diff,
sin bloquear los estilos de limpieza existentes. Sigue la misma clasificación de rutas de pruebas
que `scripts/changed-lanes.mjs` y omite la propia implementación de las funciones auxiliares compartidas.
`check:changed` ejecuta este informe para las rutas de pruebas modificadas como una señal de CI
solo de advertencia (anotaciones de advertencia de GitHub, no fallos).

## Flujos de trabajo en vivo y de Docker/Parallels

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite en vivo (modelos y sondeos de herramientas/imágenes del Gateway): `pnpm test:live`
- Selección silenciosa de un único archivo en vivo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Informes de rendimiento en tiempo de ejecución: ejecute `OpenClaw Performance` con
  `live_openai_candidate=true` para un turno real del agente `openai/gpt-5.6-luna` o
  `deep_profile=true` para obtener artefactos de CPU/montículo/traza de Kova. Las ejecuciones
  programadas diarias publican informes de los canales del proveedor simulado, del perfil
  detallado y de GPT-5.6 Luna en `openclaw/clawgrit-reports` mediante un trabajo publicador
  independiente que consume artefactos; si falta la autenticación del publicador o no es válida,
  fallan las ejecuciones programadas y las que usan `profile=release`. Las ejecuciones manuales
  que no son de publicación conservan los artefactos de GitHub y consideran orientativa la
  publicación de informes. El informe del proveedor simulado también incluye cifras de arranque
  del Gateway a nivel de código fuente, memoria, presión de plugins, bucle repetido de saludo del
  modelo falso y arranque de la CLI.
- Barrido de modelos en vivo con Docker: `pnpm test:docker:live-models`
  - Cada modelo seleccionado ejecuta un turno de texto y un pequeño sondeo similar a una lectura de archivo.
    Los modelos cuyos metadatos anuncian entrada de `image` también ejecutan un pequeño turno con imagen.
    Desactive los sondeos adicionales con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` al aislar fallos de proveedores.
  - Cobertura de CI: tanto `OpenClaw Scheduled Live And E2E Checks`, que se ejecuta diariamente, como
    `OpenClaw Release Checks`, que se ejecuta manualmente, llaman al flujo de trabajo reutilizable en
    vivo/e2e con `include_live_suites: true`, lo que incluye trabajos de la matriz de modelos en vivo
    de Docker fragmentados por proveedor.
  - Para repeticiones específicas de CI, ejecute `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` y `live_models_only: true`.
  - Añada los nuevos secretos de proveedores con alta capacidad de señal a `scripts/ci-hydrate-live-auth.sh`,
    además de a `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` y a sus
    invocadores programados/de publicación.
- Prueba de humo del chat vinculado nativo de Codex: `pnpm test:docker:live-codex-bind`
  - Ejecuta un canal en vivo de Docker contra la ruta app-server de Codex, vincula un
    mensaje directo sintético de Slack con `/codex bind`, ejercita `/codex fast` y
    `/codex permissions` y, a continuación, verifica que una respuesta de texto sin formato
    y un archivo adjunto de imagen se enruten mediante la vinculación nativa del plugin en lugar de ACP.
- Prueba de humo del arnés del app-server de Codex: `pnpm test:docker:live-codex-harness`
  - Ejecuta turnos del agente del Gateway mediante el arnés del app-server de Codex,
    propiedad del plugin, verifica `/codex status` y `/codex models` y, de forma predeterminada,
    ejercita sondeos de imagen, MCP de Cron, subagente y Guardian. Desactive el sondeo del
    subagente con `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` al aislar otros fallos.
    Para una comprobación específica del subagente, desactive los demás sondeos:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Esto finaliza después del sondeo del subagente, salvo que se establezca
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Prueba de humo de instalación bajo demanda de Codex: `pnpm test:docker:codex-on-demand`
  - Instala el tarball empaquetado de OpenClaw en Docker, ejecuta la incorporación con clave de API
    de OpenAI y verifica que el plugin de Codex y la dependencia `@openai/codex`
    se hayan descargado bajo demanda en la raíz administrada del proyecto npm.
- Prueba de humo en vivo de dependencias de herramientas de plugins: `pnpm test:docker:live-plugin-tool`
  - Empaqueta un plugin de prueba con una dependencia real de `slugify`, lo instala
    mediante `npm-pack:`, verifica la dependencia en la raíz administrada del proyecto npm
    y, a continuación, solicita a un modelo de OpenAI en vivo que llame a la herramienta
    del plugin y devuelva el slug oculto.
- Prueba de humo del comando de rescate de Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Comprobación opcional y redundante de la superficie del comando de rescate del canal
    de mensajes. Ejercita `/crestodian status`, pone en cola un cambio persistente de modelo,
    responde con `/crestodian yes` y verifica la ruta de escritura de auditoría/configuración.
- Prueba de humo de la primera ejecución de Crestodian en Docker: `pnpm test:docker:crestodian-first-run`
  - Parte de un directorio de estado de OpenClaw vacío y primero demuestra que la CLI empaquetada
    `openclaw crestodian` produce un cierre seguro sin inferencia. A continuación, prueba y activa
    un Claude falso mediante el módulo de activación empaquetado. Solo después, una solicitud
    imprecisa a la CLI empaquetada llega al planificador y se resuelve en una configuración tipada,
    seguida de operaciones puntuales de modelo, agente, plugin de Discord y SecretRef. Valida las
    entradas de configuración y auditoría. Esto aporta evidencia complementaria de la comprobación
    y las operaciones, no una prueba de incorporación interactiva ni del agente, la herramienta o
    la aprobación de Crestodian. El mismo canal está disponible en QA Lab mediante
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Prueba de humo de costes de Moonshot/Kimi: con `MOONSHOT_API_KEY` configurada, ejecute
  `openclaw models list --provider moonshot --json` y, a continuación, ejecute un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  aislado con `moonshot/kimi-k2.6`. Verifique que el JSON indique Moonshot/K2.6 y que la
  transcripción del asistente almacene el valor normalizado `usage.cost`.

<Tip>
Cuando solo sea necesario un caso que falla, se recomienda limitar las pruebas en vivo mediante las variables de entorno de la lista de permitidos descritas más adelante.
</Tip>

## Ejecutores específicos de control de calidad

Estos comandos complementan las suites de pruebas principales cuando se necesita el realismo de QA Lab.

CI ejecuta QA Lab en flujos de trabajo dedicados. La paridad con agentes está integrada en
`QA-Lab - All Lanes` y en la validación de versiones, no en un flujo de trabajo independiente para PR.
Para una validación amplia, se debe utilizar `Full Release Validation` con
`rerun_group=qa-parity` o el grupo de control de calidad de las comprobaciones de publicación. Las
comprobaciones de publicación estable/predeterminadas mantienen las pruebas exhaustivas prolongadas
en vivo/Docker tras `run_release_soak=true`; el perfil `full` las fuerza. `QA-Lab - All Lanes` se
ejecuta cada noche en `main` y mediante ejecución manual con el canal de paridad simulado, el canal
de Matrix en vivo, el canal de Telegram en vivo administrado por Convex y el canal de Discord en vivo
administrado por Convex como trabajos paralelos. El control de calidad programado y las comprobaciones
de publicación pasan explícitamente `--profile fast` a Matrix, mientras que el valor predeterminado de
la CLI de Matrix y de la entrada del flujo de trabajo manual sigue siendo `all`; la ejecución manual
puede fragmentar `all` en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.
`OpenClaw Release Checks` ejecuta la paridad, además de los canales rápidos de Matrix y Telegram,
antes de aprobar la publicación, usando `mock-openai/gpt-5.6-luna` para las comprobaciones de
transporte de publicación, a fin de que sean deterministas y eviten el arranque normal del plugin
del proveedor. Estos Gateways de transporte en vivo desactivan la búsqueda en memoria; el comportamiento
de la memoria sigue cubierto por las suites de paridad de control de calidad.

Los fragmentos de medios en vivo de la publicación completa utilizan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que ya incluye
`ffmpeg` y `ffprobe`. Los fragmentos de modelos/backends en vivo de Docker utilizan la imagen compartida
`ghcr.io/openclaw/openclaw-live-test:<sha>`, creada una sola vez por cada commit seleccionado,
y después la descargan con `OPENCLAW_SKIP_DOCKER_BUILD=1` en lugar de volver a crearla
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de control de calidad respaldados por el repositorio directamente en el host.
  - Escribe los artefactos de nivel superior `qa-evidence.json`, `qa-suite-summary.json` y
    `qa-suite-report.md` para el conjunto de escenarios seleccionado, incluidas
    las selecciones de escenarios de flujo mixto, Vitest y Playwright.
  - Cuando se inicia mediante `pnpm openclaw qa run --qa-profile <profile>`, incorpora
    la tabla de puntuación del perfil de taxonomía seleccionado en el mismo `qa-evidence.json`.
    `smoke-ci` escribe evidencia reducida (`evidenceMode: "slim"`, sin
    `execution` por entrada). `release` cubre el subconjunto seleccionado de preparación para el lanzamiento; `all`
    selecciona todas las categorías de madurez activas y se orienta a ejecuciones explícitas del flujo de trabajo
    QA Profile Evidence cuando se necesita un artefacto de tabla de puntuación completo.
  - Ejecuta de forma predeterminada varios escenarios seleccionados en paralelo con
    procesos de trabajo de Gateway aislados. `qa-channel` usa de forma predeterminada una concurrencia de 4 (limitada por el
    número de escenarios seleccionados). Use `--concurrency <count>` para ajustar el número de
    procesos de trabajo, o `--concurrency 1` para la vía serie anterior.
  - Finaliza con un código distinto de cero cuando falla algún escenario. Use `--allow-failures` para obtener
    artefactos sin un código de salida de error.
  - Admite los modos de proveedor `live-frontier`, `mock-openai` y `aimock`.
    `aimock` inicia un servidor de proveedor local respaldado por AIMock para ofrecer cobertura experimental
    de fixtures y simulaciones de protocolo sin sustituir la vía
    `mock-openai`, que tiene en cuenta los escenarios.
- `pnpm openclaw qa coverage --match <query>`
  - Busca en los identificadores, títulos, superficies, identificadores de cobertura, referencias de documentación y
    de código, plugins y requisitos de proveedor de los escenarios; después, muestra los objetivos
    de la suite que coinciden.
  - Use este comando antes de una ejecución de QA Lab cuando conozca el comportamiento o la ruta de archivo
    afectados, pero no el escenario más pequeño. Es solo orientativo: aún debe elegir pruebas
    simuladas, reales, de Multipass, Matrix o de transporte en función del comportamiento
    que se modifica.
- `pnpm test:plugins:kitchen-sink-live`
  - Ejecuta el conjunto exhaustivo de pruebas en vivo del plugin OpenAI Kitchen Sink mediante QA Lab.
    Instala el paquete externo Kitchen Sink, verifica el inventario de superficies del SDK
    del plugin, sondea `/healthz` y `/readyz`, registra evidencia de
    CPU/RSS del Gateway, ejecuta un turno real de OpenAI y comprueba diagnósticos
    adversariales. Requiere autenticación real de OpenAI, como `OPENAI_API_KEY`. En
    sesiones de Testbox hidratadas, carga automáticamente el perfil de autenticación real
    de Testbox cuando está disponible el auxiliar `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Ejecuta la prueba de rendimiento de inicio del Gateway junto con un pequeño paquete de escenarios simulados de QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) y escribe un resumen combinado de observaciones de CPU
    en `.artifacts/gateway-cpu-scenarios/`.
  - De forma predeterminada, solo marca observaciones sostenidas de CPU elevada (`--cpu-core-warn`,
    valor predeterminado `0.9`; `--hot-wall-warn-ms`, valor predeterminado `30000`), de modo que las ráfagas breves de
    inicio se registren como métricas sin parecerse a la regresión de saturación del
    Gateway que dura varios minutos.
  - Se ejecuta con los artefactos `dist` compilados; realice primero una compilación cuando el checkout
    aún no tenga una salida de ejecución actualizada.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de control de calidad dentro de una máquina virtual Linux desechable de Multipass y conserva
    las mismas opciones de selección de escenarios y de proveedor/modelo que `qa suite`.
  - Las ejecuciones reales reenvían las entradas de autenticación de control de calidad que resultan prácticas para el invitado:
    claves de proveedor basadas en variables de entorno, la ruta de configuración del proveedor real de control de calidad y
    `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta
    mediante el espacio de trabajo montado.
  - Escribe el informe y el resumen normales de control de calidad, además de los registros de Multipass, en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de control de calidad respaldado por Docker para realizar tareas de control de calidad al estilo de un operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball de npm a partir del checkout actual, lo instala globalmente en
    Docker, ejecuta la incorporación no interactiva mediante una clave de API de OpenAI, configura
    Telegram de forma predeterminada, verifica que el entorno de ejecución del plugin empaquetado se cargue sin
    reparar dependencias al iniciar, ejecuta doctor y ejecuta un turno de agente local
    contra un endpoint simulado de OpenAI.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para ejecutar la misma vía de instalación
    empaquetada con Discord.
- `pnpm test:docker:session-runtime-context`
  - Ejecuta una prueba de humo determinista en Docker de la aplicación compilada para transcripciones con contexto
    de ejecución integrado. Verifica que el contexto de ejecución oculto de OpenClaw persista como un
    mensaje personalizado no visible, en lugar de filtrarse al turno visible del usuario;
    después, inicializa una sesión JSONL defectuosa afectada y verifica que
    `openclaw doctor --fix` la reescriba en la rama activa con una copia de seguridad.
- `pnpm test:docker:npm-telegram-live`
  - Instala en Docker un paquete candidato de OpenClaw, ejecuta la incorporación del paquete
    instalado, configura Telegram mediante la CLI instalada y después reutiliza
    la vía de control de calidad real de Telegram con ese paquete instalado como Gateway
    del sistema sometido a prueba.
  - El contenedor auxiliar monta únicamente el código fuente del entorno de pruebas `qa-lab` desde el checkout;
    el paquete instalado es propietario de `dist`, `openclaw/plugin-sdk` y del entorno de ejecución
    del plugin incluido, por lo que la vía no mezcla plugins del checkout actual en
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
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` acepta una lista separada por comas de
    identificadores de comprobaciones de control de calidad de Telegram que se deben muestrear; cuando no se establece, la comprobación predeterminada
    compatible con RTT es `telegram-mentioned-message-reply`.
  - Usa las mismas credenciales de Telegram mediante variables de entorno o la misma fuente de credenciales de Convex que
    `pnpm openclaw qa telegram`. Para la automatización de CI/lanzamientos, establezca
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` junto con
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` y un secreto de rol de Convex están presentes en
    CI, el contenedor auxiliar de Docker selecciona Convex automáticamente.
  - El contenedor auxiliar valida las variables de entorno de credenciales de Telegram o Convex en el host
    antes de las tareas de compilación/instalación de Docker. Establezca
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` únicamente cuando
    se depure deliberadamente la configuración previa a las credenciales.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescribe
    `OPENCLAW_QA_CREDENTIAL_ROLE`, que es compartida, solo para esta vía. Cuando se
    seleccionan credenciales de Convex y no se establece ningún rol, el contenedor auxiliar usa `ci` en CI
    y `maintainer` fuera de CI.
  - GitHub Actions expone esta vía como el flujo de trabajo manual para responsables de mantenimiento
    `NPM Telegram Beta E2E`. No se ejecuta al fusionar. El flujo de trabajo usa el
    entorno `qa-live-shared` y concesiones de credenciales de CI de Convex.
- GitHub Actions también expone `Package Acceptance` para realizar pruebas de producto por separado
  con un paquete candidato. Acepta una referencia de Git, una especificación publicada de npm,
  una URL HTTPS de tarball junto con SHA-256, una política de URL de confianza o un artefacto de tarball
  de otra ejecución (`source=ref|npm|url|trusted-url|artifact`), carga el archivo
  normalizado `openclaw-current.tgz` como `package-under-test` y después ejecuta el
  programador de E2E existente de Docker con los perfiles de vía `smoke`, `package`, `product`, `full`
  o `custom`. Establezca `telegram_mode=mock-openai` o
  `live-frontier` para ejecutar el flujo de trabajo de control de calidad de Telegram con el mismo artefacto
  `package-under-test`.
  - Prueba de producto de la beta más reciente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prueba mediante una URL exacta de tarball requiere un resumen criptográfico y usa la política de seguridad de URL públicas:

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

`source=trusted-url` lee `.github/package-trusted-sources.json` desde la referencia de confianza del flujo de trabajo y no acepta credenciales en la URL ni una omisión de red privada mediante una entrada del flujo de trabajo. Si la política indicada declara autenticación mediante token de portador, configure el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prueba mediante artefacto descarga un artefacto de tarball desde otra ejecución de Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaqueta e instala la compilación actual de OpenClaw en Docker, inicia el
    Gateway con OpenAI configurado y después habilita canales/plugins incluidos mediante
    modificaciones de configuración.
  - Verifica que el descubrimiento durante la configuración deje ausentes los plugins descargables
    sin configurar, que la primera reparación configurada de doctor instale explícitamente cada
    plugin descargable que falte y que un segundo reinicio no ejecute
    una reparación oculta de dependencias.
  - También instala una versión de referencia anterior conocida de npm, habilita Telegram antes de
    ejecutar `openclaw update --tag <candidate>` y verifica que
    doctor, tras la actualización del candidato, limpie los restos heredados de dependencias del plugin
    sin una reparación posterior a la instalación realizada por el entorno de pruebas.
- `pnpm test:parallels:npm-update`
  - Ejecuta la prueba de humo nativa de actualización de instalaciones empaquetadas en invitados de Parallels.
    Cada plataforma seleccionada instala primero el paquete de referencia solicitado,
    después ejecuta el comando `openclaw update` instalado en el mismo invitado y
    verifica la versión instalada, el estado de actualización, la disponibilidad del Gateway y
    un turno de agente local.
  - Use `--platform macos`, `--platform windows` o `--platform linux`
    mientras itera en un invitado. Use `--json` para obtener la ruta del artefacto de resumen
    y el estado de cada vía.
  - La vía de OpenAI usa `openai/gpt-5.6-luna` de forma predeterminada para la prueba del turno de agente real.
    Pase `--model <provider/model>` o establezca
    `OPENCLAW_PARALLELS_OPENAI_MODEL` para validar otro modelo de OpenAI.
  - Encapsule las ejecuciones locales prolongadas en un tiempo de espera del host para que los bloqueos del transporte de Parallels
    no consuman el resto de la ventana de pruebas:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - El script escribe registros anidados de las vías en
    `/tmp/openclaw-parallels-npm-update.*`. Inspeccione `windows-update.log`,
    `macos-update.log` o `linux-update.log` antes de suponer que el
    contenedor auxiliar externo está bloqueado.
  - La actualización de Windows puede tardar entre 10 y 15 minutos en las tareas de doctor posteriores a la actualización y
    en la actualización del paquete en un invitado en frío; sigue siendo un funcionamiento correcto cuando el
    registro de depuración anidado de npm continúa avanzando.
  - No ejecute este contenedor auxiliar agregado en paralelo con vías individuales de pruebas de humo de Parallels
    para macOS, Windows o Linux. Comparten el estado de la máquina virtual y pueden
    entrar en conflicto durante la restauración de instantáneas, el servicio de paquetes o el estado del Gateway del invitado.
  - La prueba posterior a la actualización ejecuta la superficie normal de plugins incluidos porque
    las fachadas de capacidades, como voz, generación de imágenes y comprensión
    multimedia, se cargan mediante las API del entorno de ejecución incluido, aunque el turno del agente
    solo compruebe una respuesta de texto sencilla.

- `pnpm openclaw qa aimock`
  - Inicia únicamente el servidor local del proveedor AIMock para realizar pruebas de humo directas
    del protocolo.
- `pnpm openclaw qa matrix`
  - Ejecuta la vía de control de calidad en vivo de Matrix contra un servidor doméstico Tuwunel
    desechable respaldado por Docker. Solo para el código fuente en checkout; las instalaciones empaquetadas no incluyen
    `qa-lab`.
  - CLI completa, catálogo de perfiles/escenarios, variables de entorno y disposición de artefactos:
    [Control de calidad de Matrix](/es/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Ejecuta la vía de control de calidad en vivo de Telegram contra un grupo privado real mediante los
    tokens de bot del controlador y del SUT proporcionados por el entorno.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id. del grupo debe ser el id. numérico
    del chat de Telegram.
  - Admite `--credential-source convex` para usar credenciales compartidas de un fondo común.
    Use el modo de entorno de forma predeterminada o defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    para habilitar las concesiones del fondo común.
  - Los valores predeterminados cubren la versión canary, la restricción por mención, el direccionamiento de comandos, `/status`,
    las respuestas mencionadas entre bots y las respuestas de comandos nativos del núcleo.
    Los valores predeterminados de `mock-openai` también cubren regresiones deterministas de cadenas de respuestas y
    de transmisión del mensaje final de Telegram. Use `--list-scenarios`
    para sondeos opcionales como `session_status`.
  - Finaliza con un código distinto de cero cuando falla algún escenario. Use `--allow-failures` para
    generar artefactos sin un código de salida de error.
  - Requiere dos bots distintos en el mismo grupo privado, y el bot SUT debe
    exponer un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilite Bot-to-Bot Communication Mode
    en `@BotFather` para ambos bots y asegúrese de que el bot controlador pueda observar
    el tráfico de bots del grupo.
  - Escribe un informe de control de calidad de Telegram, un resumen y `qa-evidence.json` en
    `.artifacts/qa-e2e/...`. Los escenarios con respuesta incluyen el RTT desde la solicitud de envío
    del controlador hasta la respuesta observada del SUT.

`Mantis Telegram Live` es el contenedor de evidencias de PR para esta vía. Ejecuta
la referencia candidata con credenciales de Telegram concedidas por Convex, representa el
paquete redactado de informe/evidencias de control de calidad en un navegador de escritorio de Crabbox, graba evidencias
en MP4, genera un GIF recortado según el movimiento, carga el paquete de artefactos y
publica evidencias insertadas en el PR mediante la aplicación de GitHub de Mantis cuando se define `pr_number`.
Los mantenedores pueden iniciarlo desde la interfaz de Actions mediante `Mantis Scenario`
(`scenario_id: telegram-live`) o directamente desde un comentario de una solicitud de incorporación de cambios:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` es el contenedor agéntico nativo de Telegram Desktop
para las evidencias visuales de antes y después del PR. Inícielo desde la interfaz de Actions con
`instructions` de formato libre, mediante `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) o desde un comentario del PR:

```text
@openclaw-mantis telegram desktop proof
```

El agente Mantis lee el PR, decide qué comportamiento visible en Telegram demuestra
el cambio, ejecuta la vía de prueba para usuarios reales de Telegram Desktop en Crabbox sobre
las referencias de base y candidata, itera hasta que los GIF nativos resultan útiles,
escribe un manifiesto `motionPreview` emparejado y publica la misma tabla de GIF
de 2 columnas mediante la aplicación de GitHub de Mantis cuando se define `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Concede o reutiliza un escritorio Linux de Crabbox, instala Telegram
    Desktop nativo, configura OpenClaw con un token concedido para el bot SUT de Telegram,
    inicia el Gateway y graba evidencias en capturas de pantalla/MP4 desde el
    escritorio VNC visible.
  - Usa `--credential-source convex` de forma predeterminada para que los flujos de trabajo solo necesiten el
    secreto del intermediario de Convex. Use `--credential-source env` con las mismas
    variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop aún necesita un inicio de sesión/perfil de usuario. El token del bot
    configura únicamente OpenClaw. Use `--telegram-profile-archive-env <name>`
    para un archivo de perfil `.tgz` en base64, o use `--keep-lease` e inicie sesión
    manualmente una vez mediante VNC.
  - Escribe `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` y `telegram-desktop-builder.mp4`
    en el directorio de salida.

Las vías de transporte en vivo comparten un contrato estándar para que los nuevos transportes no
divergan; la matriz de cobertura por vía se encuentra en
[Resumen del control de calidad: cobertura de transportes en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` es el conjunto sintético amplio y no forma parte de esa matriz.

### Credenciales compartidas de Telegram mediante Convex (v1)

Cuando se habilita `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
para el control de calidad en vivo del transporte, el laboratorio de control de calidad obtiene un arrendamiento exclusivo de un
grupo respaldado por Convex, envía Heartbeat para ese arrendamiento mientras se ejecuta el canal y
libera el arrendamiento al cerrarse. El nombre de la sección es anterior a la compatibilidad con Discord, Slack y
WhatsApp; el contrato de arrendamiento se comparte entre los distintos tipos.

Estructura de referencia del proyecto de Convex: `qa/convex-credential-broker/`

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identificador de seguimiento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite usar URL de Convex de bucle invertido con `http://` exclusivamente para el desarrollo local.

`OPENCLAW_QA_CONVEX_SITE_URL` debe usar `https://` durante el funcionamiento normal.

Los comandos administrativos de los mantenedores (añadir, eliminar y enumerar elementos del grupo) requieren
específicamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Herramientas auxiliares de la CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de las ejecuciones en vivo para comprobar la URL del sitio de Convex, los secretos del bróker,
el prefijo del endpoint, el tiempo de espera de HTTP y la accesibilidad de administración/listado sin imprimir
los valores secretos. Use `--json` para obtener una salida legible por máquinas en scripts y utilidades
de CI.

Contrato predeterminado del endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Las solicitudes se autentican con un encabezado `Authorization: Bearer <role secret>`;
los cuerpos siguientes omiten ese encabezado:

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
- `POST /admin/add` (solo el secreto del mantenedor)
  - Solicitud: `{ kind, actorId, payload, note?, status? }`
  - Éxito: `{ status: "ok", credential }`
- `POST /admin/remove` (solo el secreto del mantenedor)
  - Solicitud: `{ credentialId, actorId }`
  - Éxito: `{ status: "ok", changed, credential }`
  - Protección de arrendamiento activo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo el secreto del mantenedor)
  - Solicitud: `{ kind?, status?, includePayload?, limit? }`
  - Éxito: `{ status: "ok", credentials, count }`

Forma de la carga útil para el tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` debe ser una cadena que contenga un identificador numérico de chat de Telegram.
- `admin/add` valida esta forma para `kind: "telegram"` y rechaza las cargas útiles con formato incorrecto.

Forma de la carga útil para el tipo de usuario real de Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` y `telegramApiId` deben ser cadenas numéricas.
- `tdlibArchiveSha256` y `desktopTdataArchiveSha256` deben ser cadenas hexadecimales SHA-256.
- `kind: "telegram-user"` está reservado para el flujo de trabajo de pruebas de Telegram Desktop de Mantis. Los carriles genéricos de QA Lab no deben adquirirlo.

Cargas útiles multicanal validadas por el bróker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Los carriles de Slack también pueden obtener arrendamientos del grupo, pero la validación de la carga útil de Slack
actualmente reside en el ejecutor de QA de Slack en lugar del bróker. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para las filas de Slack.

### Adición de un canal a QA

La arquitectura y los nombres de los asistentes de escenarios para los nuevos adaptadores de canales se encuentran en
[Descripción general de QA: adición de un canal](/es/concepts/qa-e2e-automation#adding-a-channel).
El requisito mínimo: implementar el ejecutor de transporte en la interfaz compartida del host `qa-lab`,
añadir un `adapterFactory` para los escenarios compartidos, declarar `qaRunners` en el
manifiesto del plugin, montarlo como `openclaw qa <runner>` y crear escenarios en
`qa/scenarios/`.

## Conjuntos de pruebas (qué se ejecuta y dónde)

Considere los conjuntos como niveles de «realismo creciente» (y también de inestabilidad/coste crecientes).

### Unitarias/de integración (predeterminado)

- Comando: `pnpm test`
- Configuración: las ejecuciones sin destino específico usan el conjunto de fragmentos `vitest.full-*.config.ts` y pueden
  expandir fragmentos multiproyecto en configuraciones por proyecto para la
  planificación en paralelo
- Archivos: inventarios de pruebas de núcleo/unitarias en `src/**/*.test.ts`,
  `packages/**/*.test.ts` y `test/**/*.test.ts`; las pruebas unitarias de la interfaz de usuario se ejecutan en el
  fragmento dedicado `unit-ui`
- Ámbito:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación del Gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápido y estable
  - Las pruebas del resolutor y del cargador de superficies públicas deben demostrar el comportamiento general de reserva de `api.js` y
    `runtime-api.js` con pequeños accesorios de plugin generados,
    no con API de código fuente de plugins incluidos reales. Las cargas de API de plugins reales corresponden a
    conjuntos de contratos/integración propiedad del plugin.

Política de dependencias nativas:

- Las instalaciones de prueba predeterminadas omiten las compilaciones nativas opcionales de opus para Discord. La voz de Discord
  usa el `libopus-wasm` incluido y `@discordjs/opus` permanece desactivado en
  `allowBuilds` para que las pruebas locales y los carriles de Testbox no compilen el
  complemento nativo.
- Compare el rendimiento de opus nativo en el repositorio de pruebas de rendimiento de `libopus-wasm`, no
  en los ciclos predeterminados de instalación/pruebas de OpenClaw. No establezca `@discordjs/opus` en
  `true` en el `allowBuilds` predeterminado; eso hace que ciclos de instalación/pruebas no relacionados
  compilen código nativo.

<AccordionGroup>
  <Accordion title="Proyectos, fragmentos y carriles con ámbito específico">

    - Las ejecuciones no dirigidas de `pnpm test` ejecutan trece configuraciones de fragmentos más pequeñas (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso nativo gigantesco del proyecto raíz. Esto reduce el RSS máximo en máquinas con carga y evita que el trabajo de respuesta automática o de plugins prive de recursos a conjuntos de pruebas no relacionados.
    - `pnpm test --watch` sigue utilizando el grafo de proyectos nativo de `vitest.config.ts` raíz, porque un bucle de observación con varios fragmentos no resulta práctico.
    - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los destinos explícitos de archivos o directorios a través de carriles con ámbito, por lo que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita asumir todo el coste de inicio del proyecto raíz.
    - De forma predeterminada, `pnpm test:changed` expande las rutas de git modificadas en carriles con ámbito de bajo coste: modificaciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y dependientes del grafo de importaciones local. Las modificaciones de configuración, preparación o paquetes no ejecutan pruebas de forma amplia a menos que se utilice explícitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` es la puerta de comprobación local inteligente habitual para trabajos acotados. Clasifica el diff en núcleo, pruebas del núcleo, extensiones, pruebas de extensiones, aplicaciones, documentación, metadatos de versión, herramientas de Docker en vivo y herramientas generales; a continuación, ejecuta los comandos de comprobación de tipos, lint y protección correspondientes. No ejecuta pruebas de Vitest; se debe invocar `pnpm test:changed` o un `pnpm test <target>` explícito como evidencia de pruebas. Los incrementos de versión que solo afectan a metadatos de versión ejecutan comprobaciones específicas de versión, configuración y dependencias raíz, con una protección que rechaza cambios de paquetes fuera del campo de versión de nivel superior.
    - Las modificaciones del entorno ACP de Docker en vivo ejecutan comprobaciones específicas: sintaxis de shell para los scripts de autenticación de Docker en vivo y una ejecución de prueba del planificador de Docker en vivo. Los cambios en `package.json` solo se incluyen cuando el diff se limita a `scripts["test:docker:live-*"]`; las modificaciones de dependencias, exportaciones, versiones y otras superficies del paquete siguen utilizando las protecciones más amplias.
    - Las pruebas unitarias con pocas importaciones de agentes, comandos, plugins, asistentes de respuesta automática, `plugin-sdk` y áreas similares de utilidades puras se enrutan mediante el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o con un uso intensivo del entorno de ejecución permanecen en los carriles existentes.
    - Algunos archivos de código fuente auxiliares de `plugin-sdk` y `commands` también asignan las ejecuciones en modo de cambios a pruebas hermanas explícitas de esos carriles ligeros, de modo que las modificaciones de los auxiliares evitan volver a ejecutar todo el conjunto pesado de ese directorio.
    - `auto-reply` tiene grupos dedicados para los auxiliares principales de nivel superior, las pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. La CI divide además el subárbol de respuestas en fragmentos de ejecutor de agentes, despacho y enrutamiento de comandos/estado, para que un solo grupo con muchas importaciones no monopolice toda la cola de Node.
    - La CI normal de PR/main omite intencionadamente el barrido por lotes de plugins incluidos y el fragmento `agentic-plugins`, exclusivo de versiones. La Validación completa de la versión inicia el flujo de trabajo secundario independiente `Plugin Prerelease` para esos conjuntos con uso intensivo de plugins en los candidatos a versión.

  </Accordion>

  <Accordion title="Cobertura del ejecutor integrado">

    - Al modificar las entradas de descubrimiento de herramientas de mensajes o el
      contexto de ejecución de Compaction, se deben conservar ambos niveles de cobertura.
    - Se deben añadir regresiones específicas de auxiliares para los límites puros
      de enrutamiento y normalización.
    - Se deben mantener en buen estado los conjuntos de integración del ejecutor integrado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` y
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Esos conjuntos verifican que los identificadores con ámbito y el comportamiento de Compaction sigan fluyendo
      por las rutas reales de `run.ts` / `compact.ts`; las pruebas que solo abarcan
      auxiliares no sustituyen adecuadamente esas rutas de integración.

  </Accordion>

  <Accordion title="Valores predeterminados del grupo y el aislamiento de Vitest">

    - La configuración base de Vitest utiliza `threads` de forma predeterminada.
    - La configuración compartida de Vitest fija `isolate: false` y utiliza el
      ejecutor no aislado en los proyectos raíz y las configuraciones e2e y en vivo.
    - El carril de la interfaz de usuario raíz conserva su preparación y optimizador de `jsdom`, pero también se ejecuta en el
      ejecutor compartido no aislado.
    - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados de `threads` + `isolate: false`
      de la configuración compartida de Vitest.
    - `scripts/run-vitest.mjs` añade `--no-maglev` de forma predeterminada a los procesos Node
      secundarios de Vitest para reducir la actividad de compilación de V8 durante ejecuciones locales grandes.
      Se puede establecer `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para compararlo con el comportamiento
      estándar de V8.
    - `scripts/run-vitest.mjs` finaliza las ejecuciones explícitas de Vitest sin observación
      después de 5 minutos sin salida estándar ni salida de error. Se puede establecer
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desactivar el supervisor durante
      una investigación intencionadamente silenciosa.

  </Accordion>

  <Accordion title="Iteración local rápida">

    - `pnpm changed:lanes` muestra qué carriles arquitectónicos activa un diff.
    - El hook de confirmación previa solo aplica formato. Vuelve a añadir al área de preparación los archivos formateados
      y no ejecuta lint, comprobaciones de tipos ni pruebas.
    - Se debe ejecutar `pnpm check:changed` explícitamente antes de la entrega o el envío cuando
      se necesite la puerta de comprobación local inteligente.
    - De forma predeterminada, `pnpm test:changed` se enruta por carriles con ámbito de bajo coste. Solo se debe utilizar
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` cuando el agente
      determine que una modificación del entorno, la configuración, el paquete o el contrato realmente necesita
      una cobertura de Vitest más amplia.
    - `pnpm test:max` y `pnpm test:changed:max` conservan el mismo comportamiento de enrutamiento,
      pero con un límite de trabajadores mayor.
    - El escalado automático de trabajadores locales es intencionadamente conservador y se reduce
      cuando la carga media del host ya es alta, por lo que varias ejecuciones simultáneas
      de Vitest causan menos perjuicio de forma predeterminada.
    - La configuración base de Vitest marca los archivos de proyectos/configuración como
      `forceRerunTriggers` para que las repeticiones en modo de cambios sigan siendo correctas al modificarse
      la conexión de las pruebas.
    - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en
      los hosts compatibles; se puede establecer `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      para definir una ubicación de caché explícita destinada al perfilado directo.

  </Accordion>

  <Accordion title="Depuración del rendimiento">

    - `pnpm test:perf:imports` habilita los informes de duración de importaciones de Vitest, además
      de la salida con el desglose de importaciones.
    - `pnpm test:perf:imports:changed` limita la misma vista de perfilado a los
      archivos modificados desde `origin/main`.
    - Los datos de tiempo de los fragmentos se escriben en `.artifacts/vitest-shard-timings.json`.
      Las ejecuciones de toda la configuración utilizan la ruta de configuración como clave; los fragmentos de CI
      con patrones de inclusión añaden el nombre del fragmento para poder realizar un seguimiento
      independiente de los fragmentos filtrados.
    - Cuando una prueba crítica aún dedica la mayor parte del tiempo a las importaciones de inicio,
      se deben mantener las dependencias pesadas detrás de una interfaz local acotada `*.runtime.ts` y
      simular directamente esa interfaz, en lugar de importar en profundidad auxiliares del entorno de ejecución
      solo para pasarlos mediante `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el
      `test:changed` enrutado con la ruta nativa del proyecto raíz para ese
      diff confirmado y muestra el tiempo transcurrido, además del RSS máximo de macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mide el rendimiento del árbol de trabajo
      con cambios actual mediante el enrutamiento de la lista de archivos modificados a través de
      `scripts/test-projects.mjs` y la configuración raíz de Vitest.
    - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para
      los costes de inicio y transformación de Vitest/Vite.
    - `pnpm test:perf:profile:runner` escribe perfiles de CPU y memoria dinámica del ejecutor para
      el conjunto unitario con el paralelismo de archivos desactivado.

  </Accordion>
</AccordionGroup>

### Estabilidad (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuración: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` y `test/vitest/vitest.infra.config.ts`, cada una forzada a un trabajador
- Ámbito:
  - Inicia un Gateway de bucle invertido real con los diagnósticos habilitados de forma predeterminada
  - Genera actividad sintética de mensajes del Gateway, memoria y cargas útiles grandes a través de la ruta de eventos de diagnóstico
  - Consulta `diagnostics.stability` mediante la RPC WS del Gateway
  - Abarca los auxiliares de persistencia del paquete de estabilidad de diagnóstico
  - Comprueba que el registrador permanezca acotado, que las muestras sintéticas de RSS se mantengan por debajo del presupuesto de presión y que las profundidades de las colas por sesión vuelvan a cero
- Expectativas:
  - Seguro para CI y sin claves
  - Carril acotado para el seguimiento de regresiones de estabilidad, no un sustituto del conjunto completo del Gateway

### E2E (conjunto del repositorio)

- Comando: `pnpm test:e2e`
- Ámbito:
  - Ejecuta el carril E2E de comprobación básica del Gateway
  - Ejecuta el carril E2E del navegador con simulación de la interfaz de control
- Expectativas:
  - Seguro para CI y sin claves
  - Requiere que Playwright Chromium esté instalado

### E2E (comprobación básica del Gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuración: `test/vitest/vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` y las pruebas E2E de plugins incluidos en `extensions/`
- Valores predeterminados del entorno de ejecución:
  - Utiliza `threads` de Vitest con `isolate: false`, igual que el resto del repositorio.
  - Utiliza trabajadores adaptativos (CI: hasta 2; local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir el coste de E/S de la consola.
- Modificaciones útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar el número de trabajadores (con un límite de 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de la consola.
- Ámbito:
  - Comportamiento integral del Gateway con varias instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más exigentes
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en la canalización)
  - No se requieren claves reales
  - Más componentes móviles que en las pruebas unitarias (puede ser más lento)

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
  - No se requieren un Gateway, agentes ni claves de proveedores reales
  - La dependencia del navegador debe estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: comprobación básica del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `extensions/openshell/src/backend.e2e.test.ts`
- Ámbito:
  - Reutiliza un Gateway local activo de OpenShell
  - Crea un entorno aislado a partir de un Dockerfile local temporal
  - Ejercita el backend OpenShell de OpenClaw mediante un `sandbox ssh-config` real + ejecución SSH
  - Verifica el comportamiento canónico remoto del sistema de archivos mediante el puente fs del entorno aislado
- Expectativas:
  - Solo opcional; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere una CLI local de `openshell`, además de un daemon de Docker operativo
  - Requiere un Gateway local activo de OpenShell y su fuente de configuración
  - Utiliza `HOME` / `XDG_CONFIG_HOME` aislados y, a continuación, destruye el entorno aislado de prueba
- Modificaciones útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente el conjunto e2e más amplio
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para señalar un binario de la CLI no predeterminado o un script contenedor
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para exponer la configuración registrada del Gateway a la prueba aislada
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para sustituir la IP del Gateway de Docker utilizada por la configuración de la política del host

### En vivo (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `test/vitest/vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` y pruebas en vivo de plugins incluidos en `extensions/`
- Valor predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - "¿Este proveedor/modelo funciona realmente _hoy_ con credenciales reales?"
  - Detectar cambios de formato del proveedor, particularidades de las llamadas a herramientas, problemas de autenticación y comportamiento de los límites de frecuencia
- Expectativas:
  - No es estable en CI por diseño (redes reales, políticas reales del proveedor, cuotas, interrupciones)
  - Cuesta dinero / consume límites de frecuencia
  - Es preferible ejecutar subconjuntos acotados en lugar de "todo"
- Las ejecuciones en vivo utilizan claves de API ya exportadas y perfiles de autenticación preparados.
- De forma predeterminada, las ejecuciones en vivo siguen aislando `HOME` y copian el material de configuración/autenticación en un directorio de inicio temporal de prueba para que los accesorios de pruebas unitarias no puedan modificar el `~/.openclaw` real.
- Establezca `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesite intencionadamente que las pruebas en vivo utilicen el directorio de inicio real.
- `pnpm test:live` utiliza de forma predeterminada un modo más silencioso: conserva la salida de progreso `[live] ...` y silencia los registros de arranque del Gateway y los mensajes de Bonjour. Establezca `OPENCLAW_LIVE_TEST_QUIET=0` si desea recuperar todos los registros de inicio.
- Rotación de claves de API (específica del proveedor): establezca `*_API_KEYS` con formato separado por comas/puntos y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), o una sobrescritura específica para pruebas en vivo mediante `OPENCLAW_LIVE_*_KEY`; las pruebas vuelven a intentarlo cuando reciben respuestas de límite de frecuencia.
- Salida de progreso/Heartbeat:
  - Los conjuntos de pruebas en vivo emiten líneas de progreso a stderr para mostrar que las llamadas prolongadas al proveedor siguen activas, incluso cuando la captura de consola de Vitest está silenciada.
  - `test/vitest/vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/Gateway se transmitan inmediatamente durante las ejecuciones en vivo.
  - Ajuste los Heartbeat de modelos directos con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste los Heartbeat del Gateway/sondeo con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué conjunto de pruebas debo ejecutar?

Utilice esta tabla de decisión:

- Al editar lógica/pruebas: ejecute `pnpm test` (y `pnpm test:coverage` si realizó muchos cambios)
- Al modificar la red del Gateway / el protocolo WS / el emparejamiento: añada `pnpm test:e2e`
- Al depurar "mi bot no funciona" / fallos específicos del proveedor / llamadas a herramientas: ejecute un `pnpm test:live` acotado

## Pruebas en vivo (con acceso a la red)

Para la matriz de modelos en vivo, las pruebas de humo de backends de CLI, las pruebas de humo de ACP, el
arnés del servidor de aplicaciones Codex y todas las pruebas en vivo de proveedores multimedia (Deepgram, BytePlus, ComfyUI,
imagen, música, vídeo y arnés multimedia), además de la gestión de credenciales para ejecuciones en vivo:

- consulte [Pruebas de conjuntos en vivo](/es/help/testing-live). Para la lista de comprobación específica de actualizaciones y
  validación de plugins, consulte
  [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

## Ejecutores de Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores de Docker se dividen en dos grupos:

- Ejecutores de modelos en vivo: `test:docker:live-models` y `test:docker:live-gateway` ejecutan únicamente el archivo en vivo de claves de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando el directorio de configuración local, el espacio de trabajo y el archivo opcional de entorno del perfil. Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores en vivo de Docker mantienen sus propios límites prácticos cuando es necesario:
  `test:docker:live-models` utiliza de forma predeterminada el conjunto seleccionado y compatible de alta relevancia, y
  `test:docker:live-gateway` utiliza de forma predeterminada `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Establezca `OPENCLAW_LIVE_MAX_MODELS`
  o las variables de entorno del Gateway cuando desee explícitamente un límite menor o un análisis más amplio.
- `test:docker:all` crea una vez la imagen Docker en vivo mediante `test:docker:live-build`, empaqueta OpenClaw una vez como tarball de npm mediante `scripts/package-openclaw-for-docker.mjs` y, a continuación, crea/reutiliza dos imágenes de `scripts/e2e/Dockerfile`. La imagen básica es únicamente el ejecutor de Node/Git para las vías de instalación/actualización/dependencias de plugins; esas vías montan el tarball precompilado. La imagen funcional instala el mismo tarball en `/app` para las vías de funcionalidad de la aplicación compilada. Las definiciones de las vías de Docker se encuentran en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador se encuentra en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. El conjunto utiliza un planificador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla las ranuras de procesos, mientras que los límites de recursos evitan que las vías pesadas en vivo, de instalación de npm y multiservicio se inicien todas a la vez. Si una sola vía supera los límites activos, el planificador aún puede iniciarla cuando el grupo está vacío y la mantiene ejecutándose en solitario hasta que vuelve a haber capacidad disponible. Los valores predeterminados son 10 ranuras, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (y otras sobrescrituras `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) solo cuando el host de Docker disponga de mayor capacidad. El ejecutor realiza de forma predeterminada una comprobación previa de Docker, elimina los contenedores E2E obsoletos de OpenClaw, imprime el estado cada 30 segundos, almacena los tiempos de las vías correctas en `.artifacts/docker-tests/lane-timings.json` y utiliza esos tiempos para iniciar primero las vías más largas en ejecuciones posteriores. Utilice `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto ponderado de vías sin crear ni ejecutar Docker, o `node scripts/test-docker-all.mjs --plan-json` para imprimir el plan de CI de las vías seleccionadas, las necesidades de paquetes/imágenes y las credenciales.
- `Package Acceptance` es la puerta de paquetes nativa de GitHub para comprobar "¿funciona este tarball instalable como producto?". Resuelve un paquete candidato desde `source=npm`, `source=ref`, `source=url`, `source=trusted-url` o `source=artifact`, lo carga como `package-under-test` y, a continuación, ejecuta las vías E2E reutilizables de Docker con ese tarball exacto en lugar de volver a empaquetar la referencia seleccionada. Los perfiles están ordenados por amplitud: `smoke`, `package`, `product` y `full` (además de `custom` para una lista explícita de vías). Consulte [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins) para conocer el contrato de paquetes/actualizaciones/plugins, la matriz de supervivencia de actualizaciones publicadas, los valores predeterminados de las versiones y la clasificación de fallos.
- Las comprobaciones de compilación y publicación ejecutan `scripts/check-cli-bootstrap-imports.mjs` después de tsdown. La protección recorre el grafo compilado estático desde `dist/entry.js` y `dist/cli/run-main.js`, y falla si ese grafo de arranque previo al despacho importa estáticamente cualquier paquete externo (Commander, interfaz de solicitudes, undici, registro y dependencias similares que sobrecarguen el inicio cuentan) antes del despacho de comandos; también limita el fragmento compilado de ejecución del Gateway a 70 KB y rechaza las importaciones estáticas de rutas inactivas conocidas del Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) desde ese fragmento. `scripts/release-check.ts` comprueba por separado mediante pruebas de humo la CLI empaquetada con `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` y `models list --provider openai`.
- La compatibilidad heredada de Package Acceptance está limitada a `2026.4.25` (incluido `2026.4.25-beta.*`). Hasta ese límite, el arnés tolera únicamente lagunas de metadatos de paquetes publicados: entradas omitidas del inventario privado de control de calidad, ausencia de `gateway install --wrapper`, ausencia de archivos de parche en el accesorio de git derivado del tarball, ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, ausencia de persistencia de registros de instalación del mercado y migración de metadatos de configuración durante `plugins update`. Para los paquetes posteriores a `2026.4.25`, esas rutas producen fallos estrictos.
- Ejecutores de pruebas de humo en contenedores: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` y `test:docker:config-reload` inician uno o más contenedores reales y verifican rutas de integración de nivel superior.
- Las vías E2E de Docker/Bash que instalan el tarball empaquetado de OpenClaw mediante `scripts/lib/openclaw-e2e-instance.sh` limitan `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (valor predeterminado: `600s`; establezca `0` para deshabilitar el contenedor de control durante la depuración).

Los ejecutores de Docker de modelos en vivo también montan mediante enlace únicamente los directorios de autenticación de CLI necesarios
(o todos los compatibles cuando la ejecución no está acotada) y después los copian en el directorio de inicio del
contenedor antes de la ejecución para que OAuth de la CLI externa pueda actualizar los tokens
sin modificar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Prueba de humo de enlace de ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cubre Claude, Codex y Gemini de forma predeterminada, con cobertura estricta de Droid/OpenCode mediante `pnpm test:docker:live-acp-bind:droid` y `pnpm test:docker:live-acp-bind:opencode`)
- Prueba de humo del backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Prueba de humo del arnés del servidor de aplicaciones Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desarrollo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Pruebas de humo de observabilidad: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` y `pnpm qa:observability:smoke` son vías privadas de control de calidad para el código fuente extraído. Intencionadamente, no forman parte de las vías de publicación de paquetes en Docker porque el tarball de npm omite QA Lab.
- Prueba de humo en vivo de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de incorporación (TTY, estructura completa): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Prueba de humo de incorporación/canal/agente del tarball de npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente en Docker el tarball empaquetado de OpenClaw, configura OpenAI mediante una incorporación con referencia de entorno y Telegram de forma predeterminada, ejecuta doctor y ejecuta un turno simulado de un agente de OpenAI. Reutilice un tarball precompilado con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la recompilación del host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` o cambie de canal con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Prueba de humo del recorrido de usuario de la versión: `pnpm test:docker:release-user-journey` instala globalmente el tarball empaquetado de OpenClaw en un directorio de inicio de Docker limpio, ejecuta la incorporación, configura un proveedor de OpenAI simulado, ejecuta un turno de agente, instala/desinstala plugins externos, configura ClickClack con un fixture local, verifica la mensajería saliente/entrante, reinicia el Gateway y ejecuta doctor.
- Prueba de humo de incorporación tipada de la versión: `pnpm test:docker:release-typed-onboarding` instala el tarball empaquetado, controla `openclaw onboard` mediante una TTY real, configura OpenAI como proveedor con referencia a variable de entorno, verifica que no se conserve ninguna clave sin procesar y ejecuta un turno de agente simulado.
- Prueba de humo de medios/memoria de la versión: `pnpm test:docker:release-media-memory` instala el tarball empaquetado y verifica la comprensión de imágenes a partir de un archivo adjunto PNG, la salida de generación de imágenes compatible con OpenAI, la recuperación mediante búsqueda en memoria y la conservación de la recuperación tras reiniciar el Gateway.
- Prueba de humo del recorrido de usuario de actualización de la versión: `pnpm test:docker:release-upgrade-user-journey` instala de forma predeterminada la versión de referencia publicada más reciente que sea anterior al tarball candidato, configura el estado del proveedor/plugin/ClickClack en el paquete publicado, actualiza al tarball candidato y vuelve a ejecutar el recorrido principal de agente/plugin/canal. Si no existe una versión de referencia publicada anterior, reutiliza la versión candidata. Sobrescriba la versión de referencia con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Prueba de humo del marketplace de plugins de la versión: `pnpm test:docker:release-plugin-marketplace` instala desde un marketplace de fixture local, actualiza el plugin instalado, lo desinstala y verifica que la CLI del plugin desaparezca y se depuren los metadatos de instalación.
- Prueba de humo de instalación de Skills: `pnpm test:docker:skill-install` instala globalmente el tarball empaquetado de OpenClaw en Docker, desactiva en la configuración las instalaciones de archivos subidos, obtiene mediante búsqueda el slug actual de la Skill activa de ClawHub, la instala con `openclaw skills install` y verifica la Skill instalada junto con los metadatos de origen/bloqueo de `.clawhub`.
- Prueba de humo de cambio de canal de actualización: `pnpm test:docker:update-channel-switch` instala globalmente el tarball empaquetado de OpenClaw en Docker, cambia del paquete `stable` a git `dev`, verifica que funcionen el canal conservado y el plugin tras la actualización, vuelve después al paquete `stable` y comprueba el estado de actualización.
- Prueba de humo de supervivencia a la actualización: `pnpm test:docker:upgrade-survivor` instala el tarball empaquetado de OpenClaw sobre un fixture sucio de un usuario antiguo con agentes, configuración de canales, listas de plugins permitidos, estado obsoleto de dependencias de plugins y archivos existentes de espacio de trabajo/sesión. Ejecuta la actualización del paquete y doctor de forma no interactiva sin claves activas de proveedor ni de canal; después inicia un Gateway de bucle invertido y comprueba la conservación de la configuración/estado, así como los límites de inicio/estado.
- Prueba de humo de supervivencia a la actualización publicada: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` de forma predeterminada, inicializa archivos realistas de un usuario existente, configura esa versión de referencia mediante una receta de comandos integrada, valida la configuración resultante, actualiza esa instalación publicada al tarball candidato, ejecuta doctor de forma no interactiva, escribe `.artifacts/upgrade-survivor/summary.json`, inicia después un Gateway de bucle invertido y comprueba las intenciones configuradas, la conservación del estado, el inicio, `/healthz`, `/readyz` y los límites de estado de RPC. Sobrescriba una versión de referencia con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, solicite al planificador agregado que expanda versiones de referencia locales exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, y expanda fixtures con formato de incidencia mediante `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; el conjunto de incidencias notificadas incluye `configured-plugin-installs` para reparar automáticamente la instalación de plugins externos de OpenClaw. La aceptación del paquete los expone como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, resuelve tokens de metaversión de referencia como `last-stable-4` o `all-since-2026.4.23`, y la validación completa de la versión expande la puerta de paquetes de prueba prolongada de la versión a `last-stable-4 2026.4.23 2026.5.2 2026.4.15`, además de `reported-issues`.
- Prueba de humo del contexto de ejecución de sesión: `pnpm test:docker:session-runtime-context` verifica la conservación en la transcripción del contexto de ejecución oculto, además de la reparación mediante doctor de las ramas duplicadas afectadas de reescritura de prompts.
- Prueba de humo de instalación global con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empaqueta el árbol actual, lo instala con `bun install -g` en un directorio de inicio aislado y verifica que `openclaw infer image providers --json` devuelva proveedores de imágenes incluidos en lugar de quedarse bloqueado. Reutilice un tarball precompilado con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, omita la compilación del host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` o copie `dist/` desde una imagen de Docker compilada con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Prueba de humo del instalador en Docker: `bash scripts/test-install-sh-docker.sh` comparte una caché de npm entre sus contenedores raíz, de actualización y de npm directo. La prueba de humo de actualización usa de forma predeterminada `latest` de npm como versión de referencia estable antes de actualizar al tarball candidato. Sobrescríbala localmente con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` o mediante la entrada `update_baseline_version` del flujo de trabajo Install Smoke en GitHub. Las comprobaciones del instalador sin permisos de raíz mantienen una caché de npm aislada para evitar que las entradas de caché propiedad de raíz oculten el comportamiento de instalación local del usuario. Establezca `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar la caché de raíz/actualización/npm directo entre ejecuciones locales.
- La CI de Install Smoke omite la actualización global duplicada mediante npm directo con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ejecute el script localmente sin esa variable de entorno cuando se necesite cobertura directa de `npm install -g`.
- Prueba de humo de la CLI para eliminar espacios de trabajo compartidos de agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila de forma predeterminada la imagen del Dockerfile raíz, inicializa dos agentes con un espacio de trabajo en un directorio de inicio de contenedor aislado, ejecuta `agents delete --json` y verifica que el JSON sea válido y que se conserve el comportamiento del espacio de trabajo. Reutilice la imagen de la prueba de instalación con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Redes y ciclo de vida del host del Gateway: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`) conserva la prueba de humo de autenticación/estado de WebSocket en una LAN de dos contenedores y, a continuación, usa el HTTP de administración mediante loopback para comprobar el bloqueo durante la preparación, el acceso con control retenido, la recuperación mediante reanudación y una detención/iniciación preparada del mismo contenedor. La comprobación del reinicio debe finalizar antes de que venza el arrendamiento original, verifica que el estado de suspensión sea local al proceso mientras persisten la configuración del Gateway y la identidad del contenedor, y emite un JSON de tiempos de fases legible por máquinas.
- Prueba de humo de instantáneas CDP del navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila la imagen E2E del código fuente más una capa de Chromium, inicia Chromium con CDP sin procesar, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles de CDP incluyan las URL de los enlaces, los elementos interactivos promovidos por el cursor, las referencias de iframe y los metadatos de los marcos.
- Regresión de razonamiento mínimo de web_search de OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) ejecuta un servidor OpenAI simulado a través del Gateway, verifica que `web_search` eleve `reasoning.effort` de `minimal` a `low`, después fuerza el rechazo del esquema del proveedor y comprueba que el detalle sin procesar aparezca en los registros del Gateway.
- Puente de canales MCP (Gateway con datos iniciales + puente stdio + prueba de humo de marcos de notificación de Claude sin procesar): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Herramientas MCP del paquete de OpenClaw (servidor MCP stdio real + prueba de humo de permisos/denegaciones del perfil de OpenClaw integrado): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpieza de MCP de Cron/subagente (Gateway real + finalización del proceso secundario MCP stdio después de ejecuciones aisladas de Cron y ejecuciones únicas de subagentes): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (prueba de humo de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, metadatos de paquete npm malformados, referencias móviles de git, paquete integral de ClawHub, actualizaciones del marketplace y activación/inspección del paquete de Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Establezca `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para omitir el bloque de ClawHub, o sustituya el par predeterminado de paquete integral/entorno de ejecución por `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` y `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sin `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, la prueba usa un servidor local hermético de elementos de prueba de ClawHub.
- Prueba de humo de actualización sin cambios del Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Prueba de humo de la matriz del ciclo de vida del Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala el tarball empaquetado de OpenClaw en un contenedor básico, instala un Plugin de npm, alterna entre activarlo y desactivarlo, lo actualiza y revierte a una versión anterior mediante un registro npm local, elimina el código instalado y, a continuación, verifica que la desinstalación siga eliminando el estado obsoleto mientras registra métricas de RSS/CPU para cada fase del ciclo de vida.
- Prueba de humo de metadatos de recarga de configuración: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` abarca la prueba de humo de instalación/actualización para ruta local, `file:`, registro npm con dependencias elevadas, referencias móviles de git, elementos de prueba de ClawHub, actualizaciones del marketplace y activación/inspección del paquete de Claude. `pnpm test:docker:plugin-update` abarca el comportamiento de actualización sin cambios de los Plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` abarca la instalación, activación, desactivación, actualización, reversión a una versión anterior y desinstalación con código ausente de Plugins de npm con seguimiento de recursos.

Para precompilar y reutilizar manualmente la imagen funcional compartida:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Las sustituciones de imagen específicas de cada suite, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, siguen teniendo prioridad cuando se establecen. Cuando `OPENCLAW_SKIP_DOCKER_BUILD=1` apunta a una imagen remota compartida, los scripts la descargan si aún no está disponible localmente. Las pruebas de Docker del código QR y del instalador mantienen sus propios Dockerfiles porque validan el comportamiento de los paquetes y la instalación, en lugar del entorno de ejecución compartido de la aplicación compilada.

Los ejecutores de Docker con modelos en vivo también montan el checkout actual como
solo lectura y lo preparan en un directorio de trabajo temporal dentro del contenedor.
Esto mantiene ligera la imagen del entorno de ejecución y, al mismo tiempo, permite
ejecutar Vitest con el código fuente y la configuración locales exactos. El paso de
preparación omite cachés grandes que solo se usan localmente y resultados de compilación
de aplicaciones, como `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y los directorios
de resultados `.build` locales de las aplicaciones o de Gradle, para que las ejecuciones
en vivo de Docker no dediquen minutos a copiar artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que las comprobaciones en vivo del
Gateway no inicien procesos reales de los canales Telegram/Discord/etc. dentro del
contenedor. `test:docker:live-models` sigue ejecutando `pnpm test:live`, así que también
pasa `OPENCLAW_LIVE_GATEWAY_*` cuando necesites limitar o excluir la cobertura en vivo
del Gateway de esa vía de Docker.

`test:docker:openwebui` es una prueba de humo de compatibilidad de nivel superior: inicia un
contenedor del Gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor de Open WebUI con una versión fijada conectado a ese Gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` exponga `openclaw/default` y, a continuación, envía una
solicitud de chat real mediante el proxy `/api/chat/completions` de Open WebUI. Establezca
`OPENWEBUI_SMOKE_MODE=models` para las comprobaciones de CI de la ruta de lanzamiento que deban detenerse
después del inicio de sesión en Open WebUI y la detección de modelos, sin esperar a que se complete
una solicitud a un modelo activo. La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar
descargar la imagen de Open WebUI y Open WebUI puede necesitar finalizar su propia
configuración de arranque en frío. Esta vía requiere una clave utilizable de un modelo activo, proporcionada mediante
el entorno del proceso, perfiles de autenticación preparados o un
`OPENCLAW_PROFILE_FILE` explícito. Las ejecuciones correctas imprimen una pequeña carga JSON como
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` es deliberadamente determinista y no necesita una
cuenta real de Telegram, Discord ni iMessage. Arranca un contenedor del Gateway
con datos iniciales, inicia un segundo contenedor que ejecuta `openclaw mcp serve` y, a continuación,
verifica la detección de conversaciones enrutadas, las lecturas de transcripciones, los
metadatos de archivos adjuntos, el comportamiento de la cola de eventos en tiempo real, el enrutamiento de envíos salientes y las notificaciones de canales y permisos al estilo de Claude mediante el puente MCP stdio real. La
comprobación de notificaciones inspecciona directamente las tramas MCP stdio sin procesar para que la prueba de humo
valide lo que el puente emite realmente, no solo lo que un SDK de cliente específico
muestra.

`test:docker:agent-bundle-mcp-tools` es determinista y no necesita una
clave de un modelo activo. Compila la imagen Docker del repositorio, inicia un servidor de
sondeo MCP stdio real dentro del contenedor, materializa ese servidor mediante el
entorno de ejecución MCP del paquete OpenClaw integrado, ejecuta la herramienta y, a continuación, verifica
que `coding` y `messaging` conserven las herramientas `bundle-mcp`, mientras que `minimal` y
`tools.deny: ["bundle-mcp"]` las filtran.

`test:docker:cron-mcp-cleanup` es determinista y no necesita una clave de
un modelo activo. Inicia un Gateway con datos iniciales y un servidor de sondeo MCP stdio real,
ejecuta un turno de cron aislado y un turno secundario de ejecución única de `sessions_spawn` y, a continuación,
verifica que el proceso secundario de MCP finalice después de cada ejecución.

Prueba de humo manual de hilos ACP con lenguaje natural (no se ejecuta en CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserve este script para flujos de trabajo de regresión y depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, por lo que no debe eliminarse.

Variables de entorno útiles:

- `OPENCLAW_CONFIG_DIR=...` (valor predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (valor predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar únicamente las variables de entorno cargadas desde `OPENCLAW_PROFILE_FILE`, mediante directorios temporales de configuración y espacio de trabajo, sin montajes externos de autenticación de la CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (valor predeterminado: `~/.cache/openclaw/docker-cli-tools`, salvo que la ejecución ya use un directorio de enlace administrado o de CI) montado en `/home/node/.npm-global` para almacenar en caché las instalaciones de la CLI dentro de Docker
- Los directorios y archivos externos de autenticación de la CLI ubicados en `$HOME` se montan en modo de solo lectura en `/host-auth...` y, a continuación, se copian en `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados (utilizados cuando la ejecución no se limita a proveedores específicos): `.factory`, `.gemini`, `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones limitadas por proveedor montan únicamente los directorios y archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescriba esta configuración manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para limitar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar los proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en ejecuciones repetidas que no necesiten una recompilación
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantizar que las credenciales procedan del almacén de perfiles (no del entorno)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el Gateway para la prueba de humo de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sustituir el prompt de comprobación de nonce utilizado por la prueba de humo de Open WebUI
- `OPENWEBUI_IMAGE=...` para sustituir la etiqueta fijada de la imagen de Open WebUI

## Comprobación básica de la documentación

Ejecute las comprobaciones de la documentación después de editarla: `pnpm check:docs`.
Ejecute la validación completa de anclas de Mintlify cuando también necesite comprobar los encabezados dentro de las páginas: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de la «canalización real» sin proveedores reales:

- Llamada a herramientas del Gateway (OpenAI simulado, Gateway real + bucle del agente): `src/gateway/gateway.test.ts` (caso: "ejecuta de extremo a extremo una llamada simulada a una herramienta de OpenAI mediante el bucle del agente del Gateway")
- Asistente del Gateway (`wizard.start`/`wizard.next` por WS, escribe la configuración y exige autenticación): `src/gateway/gateway.test.ts` (caso: "ejecuta el asistente mediante WebSocket y escribe la configuración del token de autenticación")

## Evaluaciones de fiabilidad del agente (Skills)

Ya se dispone de algunas pruebas seguras para CI que funcionan como «evaluaciones de fiabilidad del agente»:

- Llamadas a herramientas simuladas mediante el Gateway real y el bucle del agente (`src/gateway/gateway.test.ts`).
- Flujos de extremo a extremo del asistente que validan la conexión de sesiones y los efectos de la configuración (`src/gateway/gateway.test.ts`).

Lo que aún falta para Skills (consulte [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando se enumeran Skills en el prompt, ¿elige el agente la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿lee el agente `SKILL.md` antes de usarla y sigue los pasos y argumentos requeridos?
- **Contratos del flujo de trabajo:** escenarios de varios turnos que comprueben el orden de las herramientas, la conservación del historial de la sesión y los límites del entorno aislado.

Las evaluaciones futuras deben seguir siendo deterministas en primer lugar:

- Un ejecutor de escenarios que utilice proveedores simulados para comprobar las llamadas a herramientas y su orden, las lecturas de archivos de Skills y la conexión de sesiones.
- Un pequeño conjunto de escenarios centrados en Skills (usar o evitar, restricciones, inyección de prompts).
- Evaluaciones opcionales con servicios activos (participación voluntaria y controladas mediante variables de entorno) solo después de que exista el conjunto seguro para CI.

## Pruebas de contrato (estructura de plugins y canales)

Las pruebas de contrato verifican que cada plugin y canal registrado cumpla
su contrato de interfaz. Recorren todos los plugins detectados y ejecutan un
conjunto de comprobaciones de estructura y comportamiento. La vía unitaria predeterminada de `pnpm test`
omite deliberadamente estos archivos compartidos de puntos de integración y pruebas de humo; ejecute los comandos de
contrato explícitamente cuando modifique superficies compartidas de canales o proveedores.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canales: `pnpm test:contracts:channels`
- Solo contratos de proveedores: `pnpm test:contracts:plugins`

### Contratos de canales

Se encuentran en `src/channels/plugins/contracts/*.contract.test.ts`. Categorías
actuales de nivel superior:

- **channel-catalog** - metadatos de las entradas del catálogo de canales incluidos o del registro
- **plugin** (basado en el registro, fragmentado) - estructura básica del registro de plugins
- **surfaces-only** (basado en el registro, fragmentado) - comprobaciones de estructura por superficie para `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` y `gateway`
- **session-binding** (basado en el registro) - comportamiento de vinculación de sesiones
- **outbound-payload** - estructura y normalización de la carga útil de los mensajes
- **group-policy** (alternativa) - aplicación de la política de grupo predeterminada por canal
- **threading** (basado en el registro, fragmentado) - gestión de identificadores de hilos
- **directory** (basado en el registro, fragmentado) - API de directorio/lista de miembros
- **registry** y **plugins-core.\*** - registro de plugins de canales, cargador y elementos internos de autorización para escribir la configuración

Los auxiliares del entorno de pruebas para capturar la distribución entrante y las cargas útiles salientes que utilizan estos
conjuntos se exponen internamente mediante `src/plugin-sdk/channel-contract-testing.ts`
(excluido de npm, no es una subruta pública del SDK); no existe ningún archivo independiente
`inbound.contract.test.ts` en este directorio.

### Contratos de proveedores

Se encuentran en `src/plugins/contracts/*.contract.test.ts`. Las categorías actuales
incluyen:

- **shape** - estructura del manifiesto, la API y las exportaciones del entorno de ejecución del plugin
- **plugin-registration** (+ paralelo) - casos de registro de manifiestos
- **package-manifest** - requisitos del manifiesto del paquete
- **loader** - comportamiento de configuración y desmontaje del cargador de plugins
- **registry** - contenido y búsqueda del registro de contratos de plugins
- **providers** - comportamiento compartido de los proveedores incluidos, además de los proveedores de búsqueda web
- **auth-choice** - metadatos de opciones de autenticación y comportamiento de configuración
- **provider-catalog-deprecation** - metadatos obsoletos del catálogo de proveedores
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contratos del asistente de configuración de proveedores
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - contratos de proveedores específicos de cada capacidad
- **session-actions**, **session-attachments**, **session-entry-projection** - contratos del estado de sesión propiedad de plugins
- **scheduled-turns** - metadatos de turnos programados de plugins y límites de marcas de tiempo
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - contratos del ciclo de vida del host y del entorno de ejecución de plugins, y de los límites de importación
- **extension-runtime-dependencies** - ubicación de las dependencias del entorno de ejecución para las extensiones

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de añadir o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o la detección de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves de API reales.

## Adición de regresiones (orientación)

Cuando se corrija un problema de un proveedor o modelo detectado en un servicio activo:

- Añada una regresión segura para CI si es posible (proveedor simulado o sustituido, o capture la transformación exacta de la estructura de la solicitud)
- Si el problema es intrínsecamente exclusivo de servicios activos (límites de frecuencia, políticas de autenticación), mantenga la prueba con servicios activos limitada y opcional mediante variables de entorno
- Procure apuntar a la capa más pequeña que detecte el error:
  - error de conversión o reproducción de solicitudes del proveedor -> prueba directa de modelos
  - error de la canalización de sesión, historial o herramientas del Gateway -> prueba de humo activa del Gateway o prueba simulada del Gateway segura para CI
- Protección para el recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` obtiene un destino de muestra por cada clase de SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`) y, a continuación, comprueba que se rechacen los identificadores de ejecución con segmentos de recorrido.
  - Si añade una nueva familia de destinos SecretRef con `includeInPlan` en `src/secrets/target-registry-data.ts`, actualice `classifyTargetClass` en esa prueba. La prueba falla deliberadamente cuando encuentra identificadores de destino sin clasificar, para que las clases nuevas no puedan omitirse silenciosamente.

## Relacionado

- [Pruebas con servicios activos](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
- [CI](/es/ci)
