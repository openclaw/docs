---
read_when:
    - Adición o modificación de migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-07-20T00:49:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b33c4ae538f8aa8b8049012a788261f3b9051b006f84b17c0e10fe94dc0fdc
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuraciones y estados obsoletos, comprueba el estado del sistema y proporciona pasos de reparación prácticos.

## Inicio rápido

```bash
openclaw doctor
```

### Modos sin interfaz y de automatización

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Acepta los valores predeterminados sin solicitar confirmación (incluidos los pasos de reparación de reinicio, servicio y entorno aislado cuando corresponda).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Aplica las reparaciones recomendadas sin solicitar confirmación (`--repair` es un alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Ejecuta comprobaciones de estado estructuradas para la CI o la automatización previa. Es de solo lectura: no
    muestra solicitudes, realiza reparaciones, migraciones, reinicios ni escrituras de estado.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Aplica también reparaciones agresivas (sobrescribe las configuraciones personalizadas del supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Se ejecuta sin solicitar confirmación y aplica únicamente migraciones seguras (normalización de la configuración +
    traslado del estado en disco). Omite las acciones de reinicio, servicio y entorno aislado que requieren
    confirmación humana. Las migraciones de estado heredado siguen ejecutándose automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina los servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Para revisar los cambios antes de escribirlos, abra primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Modo de análisis de solo lectura

`openclaw doctor --lint` es la variante orientada a la automatización de
`openclaw doctor --fix`. Ambos comparten el mismo registro de reglas de Doctor, pero no
seleccionan ni aplican las reglas de la misma manera:

| Modo                     | Solicitudes   | Escribe configuración/estado     | Salida                 | Úselo para                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | sí       | no                      | informe de estado accesible | una persona que comprueba el estado         |
| `openclaw doctor --fix`  | a veces | sí, con una política de reparación | registro de reparación accesible    | aplicar reparaciones aprobadas       |
| `openclaw doctor --lint` | no        | no                      | hallazgos estructurados    | CI, comprobaciones previas y puertas de revisión |

De forma predeterminada, `doctor --lint` ejecuta el perfil de automatización seguro y amplio: comprobaciones
estáticas, locales y útiles para la salida de CI o de comprobaciones previas. Omite las comprobaciones opcionales
que son informativas, sensibles al entorno, dependientes de servicios activos, relacionadas con el inventario
de cuentas o espacios de trabajo, o de limpieza histórica. Use `doctor --lint --all` cuando desee la
auditoría completa de análisis registrada, incluidas esas comprobaciones opcionales, o `--only <id>` para
una comprobación específica.

`doctor --fix` no utiliza el perfil predeterminado de análisis ni acepta
`--all`. Ejecuta la ruta de reparación ordenada de Doctor: las comprobaciones de estado modernas pueden proporcionar
una implementación opcional de `repair()`, mientras que las áreas más antiguas aún utilizan su flujo heredado
de reparación de Doctor. Algunos hallazgos del análisis son deliberadamente solo diagnósticos, por lo que
la aparición de una comprobación en `--lint --all` no implica que `--fix` vaya a modificar esa área.
El contrato separa `detect()` (informa de los hallazgos) de `repair()` (informa de
cambios, diferencias y efectos secundarios), lo que mantiene abierta una ruta para un futuro
`doctor --fix --dry-run` sin convertir las comprobaciones de análisis en planificadores de modificaciones.

Algunas comprobaciones integradas están desactivadas internamente de forma predeterminada para que sigan disponibles para
`--all`, `--only` y los flujos de reparación de Doctor sin pasar a formar parte del perfil de automatización
predeterminado `doctor --lint`. La gravedad de los hallazgos se sigue emitiendo por
hallazgo (`info`, `warning` o `error`); la selección predeterminada no es un nivel de
gravedad.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Campos de salida JSON:

- `ok`: indica si algún hallazgo alcanzó el umbral de gravedad seleccionado
- `checksRun` / `checksSkipped`: recuentos (omitidos por el perfil, `--only` o `--skip`)
- `findings`: diagnósticos estructurados con `checkId`, `severity`, `message` y, opcionalmente, `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Códigos de salida:

| Código | Significado                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | ningún hallazgo alcanza o supera el umbral seleccionado           |
| `1`  | uno o más hallazgos alcanzaron el umbral seleccionado          |
| `2`  | fallo del comando o del entorno de ejecución antes de que pudieran emitirse los hallazgos |

Opciones:

- `--severity-min info|warning|error` (valor predeterminado: `warning`): controla tanto lo que se muestra como lo que provoca una salida distinta de cero.
- `--all`: ejecuta todas las comprobaciones de análisis registradas, incluidas las comprobaciones opcionales excluidas del conjunto de automatización predeterminado.
- `--only <id>` (repetible): ejecuta únicamente los identificadores de comprobación indicados; un identificador desconocido se informa como un hallazgo de error.
- `--skip <id>` (repetible): excluye una comprobación y mantiene activo el resto de la ejecución.
- `--json`, `--severity-min`, `--all`, `--only` y `--skip` requieren `--lint`; las ejecuciones simples de `openclaw doctor` y `--fix` las rechazan.

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, interfaz y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo en modo interactivo).
    - Comprobación de vigencia del protocolo de la interfaz (recompila la interfaz de control cuando el esquema del protocolo es más reciente).
    - Comprobación de estado + solicitud de reinicio.
    - Notas sobre Skills y plugins solo cuando hay problemas; el inventario sin problemas permanece en `openclaw skills check` y `openclaw plugins list`.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de la configuración para formatos de valores heredados.
    - Migración de la configuración de conversación desde campos planos heredados de `talk.*` hacia `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y disponibilidad de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migración del proveedor y perfil heredados de OpenAI Codex (`openai-codex` → `openai`) y advertencias de ocultación por valores obsoletos de `models.providers.openai-codex`.
    - Comprobación de los requisitos previos de TLS para los perfiles OAuth de OpenAI Codex.
    - Advertencias sobre la lista de permitidos de plugins y herramientas cuando `plugins.allow` es restrictivo, pero la política de herramientas aún solicita comodines o herramientas propiedad de plugins.
    - Migración del estado heredado en disco (sesiones/directorio del agente/autenticación de WhatsApp).
    - Migración de claves del contrato del manifiesto de plugins heredados (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, carga útil `provider`, tareas de reserva de webhook `notify: true`).
    - Reparación de la versión fijada del entorno de ejecución de la CLI de Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) en `agents.defaults`, `agents.list[]` y `models.providers.*` (incluidas las entradas por modelo).
    - Limpieza de la configuración obsoleta de plugins cuando estos están habilitados; con `plugins.enabled=false`, las referencias obsoletas a plugins se conservan como configuración de contención inerte.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de los archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de solicitudes creadas por las compilaciones 2026.4.24 afectadas.
    - Detección de marcadores de recuperación tras reinicio para sesiones principales y subagentes bloqueados. Doctor informa de las sesiones bloqueadas y solo repara los indicadores de cancelación obsoletos que entran en conflicto con un marcador existente; no vuelve a habilitar la recuperación automática.
    - Comprobaciones de integridad del estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) cuando se ejecuta localmente.
    - Estado de autenticación de modelos: comprueba la caducidad de OAuth, puede renovar los tokens próximos a caducar e informa de los estados de espera o desactivación de los perfiles de autenticación.

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de la imagen del entorno aislado cuando este está habilitado.
    - Migración de servicios heredados y detección de gateways adicionales.
    - Migración del estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones del entorno de ejecución del Gateway (servicio instalado pero no iniciado; etiqueta de launchd almacenada en caché).
    - Advertencias sobre el estado de los canales (consultadas desde el Gateway en ejecución).
    - Las comprobaciones de permisos específicas de cada canal se encuentran en `openclaw channels capabilities`; por ejemplo, los permisos de los canales de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp cuando el estado del bucle de eventos del Gateway está degradado y aún hay clientes TUI locales en ejecución; `--fix` detiene únicamente los clientes TUI locales verificados.
    - Reparación de rutas de Codex para referencias de modelos heredadas `openai-codex/*` en modelos principales, alternativas, modelos de generación de imágenes/vídeos, sobrescrituras de Heartbeat/subagentes/Compaction, hooks, sobrescrituras de modelos de canales y versiones fijadas de rutas de sesión; `--fix` las reescribe como `openai/*`, migra los perfiles y el orden de autenticación `openai-codex:*` a `openai:*`, elimina las versiones fijadas obsoletas del entorno de ejecución de sesiones y agentes completos, y permite que la ruta efectiva reparada determine si Codex es compatible.
    - Auditoría de la configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza de variables de entorno de proxy incrustadas en servicios del Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones del entorno de ejecución del Gateway (servicios Bun heredados no compatibles, rutas de gestores de versiones).
    - Diagnósticos de colisiones de puertos del Gateway (valor predeterminado: `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de mensajes directos abiertos.
    - Comprobaciones de autenticación del Gateway para el modo de token local (ofrece generar un token cuando no existe ninguna fuente de tokens; no sobrescribe las configuraciones SecretRef de tokens).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de funciones/ámbitos, divergencia obsoleta de la caché local de tokens de dispositivos y divergencia de autenticación de los registros emparejados).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de persistencia de systemd en Linux.
    - Comprobación del tamaño de los archivos de inicialización del espacio de trabajo (advertencias de truncamiento o proximidad al límite para archivos de contexto).
    - Comprobación de disponibilidad de Skills para el agente predeterminado; informa de las Skills permitidas a las que les faltan binarios, variables de entorno, configuración o requisitos del sistema operativo, y `--fix` puede deshabilitar las Skills no disponibles en `skills.entries`.
    - Comprobación del estado del completado del shell e instalación/actualización automática.
    - Comprobación de disponibilidad del proveedor de incrustaciones para la búsqueda en memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalaciones desde el código fuente (incompatibilidad del espacio de trabajo de pnpm, recursos de interfaz ausentes, binario tsx ausente).
    - Escribe la configuración actualizada y los metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno retroactivo y restablecimiento de la interfaz de Dreams

  La escena Dreams de la interfaz de control incluye las acciones **Rellenar**, **Restablecer** y **Borrar fundamentados** para el flujo de trabajo de Dreaming fundamentado. Estas usan métodos RPC de estilo doctor del Gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

  | Acción                | Qué hace                                                                                                                                                                                                 |
  | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Rellenar              | Examina los archivos históricos `memory/YYYY-MM-DD.md` del espacio de trabajo activo, ejecuta la pasada de diario REM fundamentada y escribe entradas de relleno reversibles en `DREAMS.md`.            |
  | Restablecer           | Elimina únicamente las entradas marcadas del diario de relleno de `DREAMS.md`.                                                                                                                    |
  | Borrar fundamentados  | Elimina únicamente las entradas provisionales a corto plazo exclusivas de la fundamentación procedentes de la reproducción histórica que aún no han acumulado recuperación en vivo ni respaldo diario. |

  Ninguna de estas acciones edita `MEMORY.md`, ejecuta migraciones completas de doctor ni incorpora por sí sola candidatos fundamentados al almacén activo de promoción a corto plazo. Para introducir la reproducción histórica fundamentada en la vía normal de promoción profunda, use en su lugar el flujo de la CLI:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Esto incorpora candidatos duraderos fundamentados al almacén de Dreaming a corto plazo, mientras `DREAMS.md` sigue siendo la superficie de revisión.

  ## Comportamiento detallado y justificación

  <AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si se trata de un checkout de git y doctor se ejecuta de forma interactiva, ofrece realizar una actualización (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de la configuración">
    Doctor normaliza las formas de valores heredadas al esquema actual. La configuración actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, con la configuración de voz en tiempo real en `talk.realtime.*`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores, y reescribe los selectores heredados de nivel superior en tiempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa entradas comodín o entradas de herramientas propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas de plugins que realmente se cargan; no elude la lista de permitidos exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene una clave obsoleta con una migración activa, los demás comandos se niegan a ejecutarse y solicitan que se ejecute `openclaw doctor`. Doctor explica qué claves heredadas se encontraron, muestra la migración aplicada y reescribe `~/.openclaw/openclaw.json` con el esquema actualizado. El inicio del Gateway rechaza los formatos de configuración heredados y solicita que se ejecute `openclaw doctor --fix`; no reescribe `openclaw.json` durante el inicio. `openclaw doctor --fix` también gestiona las migraciones del almacén de trabajos de Cron.

    <Note>
      Doctor solo conserva migraciones automáticas durante aproximadamente dos meses después de que se
      retire una clave. Las claves heredadas más antiguas (por ejemplo, las originales
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` de nivel superior o `identity` de nivel superior
      de la forma de configuración anterior a múltiples agentes) ya no tienen una ruta de migración;
      la configuración que las usa ahora no supera la validación, en lugar de reescribirse. Corrija
      esas claves manualmente conforme a la referencia de configuración actual antes de que doctor
      pueda continuar.
    </Note>

    Migraciones activas:

    | Clave heredada                                                                                   | Clave actual                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | eliminada (WebChat está retirado)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (y por cuenta)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredadas        | `talk.provider` + `talk.providers.<provider>`                               |
    | selectores heredados de nivel superior de Talk en tiempo real (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | campos de hablante de TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (todos los canales excepto Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (todos los canales, incluido Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (el inicio del Gateway también omite los proveedores cuyo `api` es un valor de enumeración futuro/desconocido, en lugar de cerrarse de forma segura) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | eliminada (configuración heredada del relé de la extensión de Chrome)                             |
    | `mcp.servers.*.type` (alias nativos de la CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | alias de tiempo de espera de MCP `connectTimeout`/`connect_timeout`/`timeout`                                 | `connectionTimeoutMs`/`requestTimeoutMs`                                    |
    | `defaultModel` de nivel superior                                                                         | `agents.defaults.model`                                                      |
    | `messages.messagePrefix`                                                                         | `channels.whatsapp.messagePrefix`                                            |
    | `session.maintenance.pruneDays`, `session.resetByType.dm`                                        | `session.maintenance.pruneAfter`, `session.resetByType.direct`               |
    | `tui` de nivel superior                                                                                  | eliminada (el pie de página de la TUI usa el valor predeterminado compacto)                            |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | eliminada (el servidor de aplicaciones Codex siempre mantiene como nativas las herramientas del espacio de trabajo nativas de Codex) |
    | `commands.modelsWrite`                                                                           | eliminada (`/models add` está obsoleta)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | eliminadas (el valor exacto `NO_REPLY` ya no se reescribe como texto alternativo visible)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | eliminada (OpenClaw controla el prompt del sistema generado)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | eliminada (use `models.providers.<id>.timeoutSeconds` para tiempos de espera lentos del modelo/proveedor, manteniéndolos por debajo del límite máximo de tiempo de espera del agente/ejecución) |
    | `memorySearch` de nivel superior                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (cualquier nivel)                                                            | eliminada (los índices de memoria residen en la base de datos de cada agente)                       |
    | `heartbeat` de nivel superior                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | identificadores de política de `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | eliminadas (obsoletas)                                                        |
    | Controles de ajuste del entorno de ejecución y de los canales retirados en 2026.7                                               | eliminados (se aplican los valores predeterminados de producción integrados)                               |

    <Note>
      Las filas `plugins.entries.voice-call.config.*` anteriores son normalizadas por
      el propio plugin Voice Call cada vez que se carga la configuración, no por `openclaw
      doctor`. El plugin también registra una advertencia al iniciarse que apunta a `openclaw
      doctor --fix`, pero doctor no reescribe actualmente
      `openclaw.json` para estas claves; la normalización del propio plugin es la que
      aplica el cambio en tiempo de ejecución.
    </Note>

    Orientación sobre la cuenta predeterminada para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento alternativo puede seleccionar una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` se establece en un ID de cuenta desconocido, doctor muestra una advertencia y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Anulaciones del proveedor OpenCode">
    Si se ha añadido manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, esto anula el catálogo OpenCode integrado de `openclaw/plugin-sdk/llm`. Esto puede forzar a los modelos a usar la API incorrecta o poner a cero los costes. Doctor muestra una advertencia para que se pueda eliminar la anulación y restaurar el enrutamiento de API y los costes específicos de cada modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de Chrome MCP">
    Si la configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión de Chrome MCP local al host (`browser.profiles.*.driver: "extension"` → `"existing-session"`; se elimina `browser.relayBindHost`).

    Doctor también audita la ruta de Chrome MCP local al host cuando se utiliza `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles de conexión automática predeterminados
    - comprueba la versión de Chrome detectada y muestra una advertencia cuando es anterior a Chrome 144
    - recuerda que se debe habilitar la depuración remota en la página de inspección del navegador (por ejemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar la opción de Chrome. Chrome MCP local al host sigue requiriendo un navegador basado en Chromium 144+ en el host del gateway/nodo, ejecutándose localmente, con la depuración remota habilitada y con la primera solicitud de consentimiento de conexión aprobada en el navegador.

    La preparación aquí solo abarca los requisitos previos de conexión local. Existing-session mantiene los límites actuales de las rutas de Chrome MCP; las rutas avanzadas como `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes siguen requiriendo un navegador administrado o un perfil CDP sin procesar. Esta comprobación no se aplica a Docker, sandbox, navegadores remotos ni otros flujos sin interfaz gráfica, que siguen utilizando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL puede validar la cadena de certificados. Si el sondeo falla por un error de certificado (por ejemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, un certificado caducado o uno autofirmado), doctor muestra instrucciones de corrección específicas para la plataforma. En macOS con un Node de Homebrew, la solución suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el gateway funciona correctamente.
  </Accordion>
  <Accordion title="2e. Anulaciones del proveedor OAuth de Codex">
    Si anteriormente se añadieron opciones de transporte heredadas de OpenAI en `models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor OAuth de Codex. Doctor muestra una advertencia cuando detecta esas opciones de transporte antiguas junto con OAuth de Codex, para que se pueda eliminar o reescribir la anulación de transporte obsoleta y restaurar el comportamiento de enrutamiento actual. Los proxies personalizados y las anulaciones solo de encabezados siguen siendo compatibles y no activan esta advertencia, pero esas rutas de solicitud definidas no son aptas para la selección implícita de Codex.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba si hay referencias de modelo `openai-codex/*` heredadas. El enrutamiento nativo del entorno de Codex utiliza referencias de modelo canónicas `openai/*`, pero el prefijo por sí solo nunca selecciona Codex. Si la política de tiempo de ejecución no está establecida o es `auto`, solo es apta una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin ninguna anulación de solicitud definida. Véase [Tiempo de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).

    En el modo `--fix` / `--repair`, doctor reescribe las referencias afectadas del agente predeterminado y de cada agente, incluidos los modelos principales, las alternativas, los modelos de generación de imágenes y vídeo, las anulaciones de heartbeat/subagente/compaction, los hooks, las anulaciones de modelos de canales y el estado persistente obsoleto de las rutas de sesión:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - La intención de Codex se traslada a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo para las referencias de modelos de agentes reparadas.
    - Se eliminan la configuración obsoleta del tiempo de ejecución de todo el agente y las fijaciones persistentes del tiempo de ejecución de las sesiones, porque la selección del tiempo de ejecución tiene ámbito de proveedor/modelo.
    - La política existente de tiempo de ejecución del proveedor/modelo se conserva, salvo que la referencia de modelo heredada reparada necesite el enrutamiento de Codex para mantener la ruta de autenticación anterior.
    - Las listas existentes de modelos alternativos se conservan con sus entradas heredadas reescritas; las opciones copiadas de cada modelo se trasladan de la clave heredada a la clave canónica `openai/*`.
    - Se reparan los valores persistentes de sesión `modelProvider`/`providerOverride`, `model`/`modelOverride`, los avisos de alternativas y las fijaciones de perfiles de autenticación en todos los almacenes de sesiones de agentes detectados.
    - Doctor repara por separado las fijaciones obsoletas `agentRuntime.id: "codex-cli"` (un ID de tiempo de ejecución heredado distinto) y las convierte en `"codex"` en las entradas de modelo `agents.defaults`, `agents.list[]` y `models.providers.*`.
    - `/codex ...` significa «controlar o vincular una conversación nativa de Codex desde el chat».
    - `/acp ...` o `runtime: "acp"` significa «utilizar el adaptador externo ACP/acpx».

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también examina los almacenes de sesiones de agentes detectados en busca de estado obsoleto de rutas creado automáticamente después de trasladar los modelos configurados o el tiempo de ejecución fuera de una ruta propiedad de un plugin, como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto creado automáticamente, como las fijaciones de modelos `modelOverrideSource: "auto"`, los metadatos del modelo de tiempo de ejecución, los ID fijados del entorno, las vinculaciones de sesiones de la CLI y las anulaciones automáticas de perfiles de autenticación cuando la ruta propietaria ya no está configurada. Las selecciones explícitas de modelos de sesión del usuario o heredadas se notifican para su revisión manual y no se modifican; se pueden cambiar con `/model ...`, `/new` o restableciendo la sesión cuando esa ruta ya no se desea.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (disposición en disco)">
    Doctor puede migrar disposiciones antiguas en disco a la estructura actual:

    - Almacén de sesiones y transcripciones: de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente: de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys): del `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`) a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)
    - Identidad firmada del dispositivo: de `~/.openclaw/identity/device.json` a la fila `device_identities` de `primary` en `state/openclaw.sqlite`; el archivo independiente de autenticación del dispositivo no se modifica

    Estas migraciones se realizan con el mejor esfuerzo y son idempotentes; doctor emite advertencias cuando deja carpetas heredadas como copias de seguridad. El Gateway y la CLI también migran automáticamente las sesiones heredadas y el directorio del agente al iniciarse, para que el historial, la autenticación y los modelos queden en la ruta específica de cada agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionadamente solo mediante `openclaw doctor`. La normalización del proveedor de Talk y del mapa de proveedores compara por igualdad estructural, por lo que las diferencias únicamente en el orden de las claves ya no activan cambios `doctor --fix` nulos y repetidos.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de plugins heredados">
    Doctor examina todos los manifiestos de plugins instalados en busca de claves de capacidad obsoletas de nivel superior (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece trasladarlas al objeto `contracts` y reescribir el archivo de manifiesto en el mismo lugar. Esta migración es idempotente; si `contracts` ya contiene los mismos valores, se elimina la clave heredada sin duplicar datos.
  </Accordion>
  <Accordion title="3b. Migraciones del almacén Cron heredado">
    Doctor también comprueba si el almacén de tareas Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada o `cron.store` cuando se anula) contiene formatos de tareas antiguos que el programador todavía acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` en la carga útil → `delivery.channel` explícito
    - tareas de alternativa de Webhook `notify: true` heredadas → entrega explícita mediante Webhook a partir del valor `cron.webhook` sin procesar y retirado, cuando sea válido; las tareas de anuncio conservan su entrega por chat y reciben `delivery.completionDestination`. Después, doctor elimina la clave de configuración antigua. Sin un Webhook heredado utilizable, el marcador inerte `notify` de nivel superior se elimina de las tareas sin destino (la entrega existente, incluido el anuncio, se conserva), ya que la entrega en tiempo de ejecución nunca lo lee.

    El Gateway también sanea las filas Cron mal formadas durante la carga para que las tareas válidas sigan ejecutándose. Las filas sin procesar mal formadas se copian en `jobs-quarantine.json`, junto al almacén activo, antes de eliminarlas de `jobs.json`; doctor informa de las filas en cuarentena para que se puedan revisar o reparar manualmente.

    El inicio del Gateway normaliza la proyección del tiempo de ejecución e ignora el marcador `notify` de nivel superior, pero deja el estado persistente de Cron para que doctor lo repare. Doctor elimina los marcadores inertes de las tareas sin destino de migración (`delivery.mode` ninguno/ausente, un destino Webhook heredado inutilizable o una entrega existente de anuncio/chat), sin modificar la entrega existente, por lo que las ejecuciones repetidas de `doctor --fix` ya no vuelven a advertir sobre la misma tarea.

    En Linux, doctor también muestra una advertencia cuando el crontab del usuario todavía invoca el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local al host no es mantenido por la versión actual de OpenClaw y puede escribir mensajes `Gateway inactive` falsos en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede acceder al bus de usuario de systemd. Elimine la entrada obsoleta del crontab con `crontab -e`; utilice `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor examina todos los directorios de sesiones de agentes en busca de archivos de bloqueo de escritura obsoletos que hayan quedado después de que una sesión terminara de forma anómala. Para cada archivo de bloqueo encontrado, informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID inactivo, metadatos del propietario con formato incorrecto, antigüedad superior a 30 minutos o un PID activo que se ha demostrado que pertenece a un proceso ajeno a OpenClaw). En el modo `--fix` / `--repair`, elimina automáticamente los bloqueos cuyos propietarios estén inactivos, huérfanos, reciclados, tengan metadatos antiguos con formato incorrecto o no pertenezcan a OpenClaw. Los bloqueos antiguos que aún pertenecen a un proceso activo de OpenClaw se notifican, pero se conservan para que doctor no interrumpa un proceso activo de escritura de transcripciones.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripciones de sesión">
    Doctor examina los archivos JSONL de sesiones de agentes en busca de la estructura de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto interno de ejecución de OpenClaw y un elemento hermano activo que contiene el mismo prompt visible del usuario. En el modo `--fix` / `--repair`, doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción con la rama activa para que el historial del gateway y los lectores de memoria dejen de ver turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesiones, enrutamiento y seguridad)">
    El directorio de estado es el centro neurálgico operativo. Si desaparece, se pierden las sesiones, las credenciales, los registros y la configuración, salvo que existan copias de seguridad en otro lugar.

    Doctor comprueba:

    - **Directorio de estado ausente**: advierte sobre la pérdida catastrófica del estado, solicita que se vuelva a crear el directorio y recuerda que no puede recuperar los datos perdidos.
    - **Permisos del directorio de estado**: verifica que se pueda escribir en él; ofrece reparar los permisos (y muestra una indicación de `chown` cuando detecta una discrepancia de propietario o grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve dentro de iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, porque las rutas respaldadas por sincronización pueden provocar operaciones de E/S más lentas y condiciones de carrera entre bloqueos y sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve en una fuente de montaje `mmcblk*`, porque las operaciones de E/S aleatorias respaldadas por SD/eMMC pueden ser más lentas y desgastar el soporte con mayor rapidez durante las escrituras de sesiones y credenciales.
    - **Directorio de estado volátil en Linux**: advierte cuando el estado se resuelve en `tmpfs` o `ramfs`, porque las sesiones, las credenciales, la configuración y el estado de SQLite (con archivos auxiliares WAL/diario) desaparecen al reiniciar. Los montajes `overlay` de Docker no se señalan intencionadamente porque sus capas de escritura persisten tras reiniciar el host mientras el contenedor se mantenga.
    - **Directorios de sesiones ausentes**: `sessions/` y el directorio del almacén de sesiones son necesarios para conservar el historial y evitar fallos de `ENOENT`.
    - **Discrepancia de transcripciones**: advierte cuando las entradas de sesiones recientes no tienen sus archivos de transcripción.
    - **Sesión principal con «JSONL de 1 línea»**: señala cuando la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio del modo remoto**: si `gateway.mode=remote`, doctor recuerda que debe ejecutarse en el host remoto (el estado se encuentra allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` permite la lectura al grupo o a cualquier usuario y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación del modelo (caducidad de OAuth)">
    Doctor examina los perfiles de OAuth del almacén de autenticación, advierte cuando los tokens están próximos a caducar o han caducado y puede renovarlos cuando sea seguro. Si el perfil de OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta del token de configuración de Anthropic. Las solicitudes de renovación solo aparecen durante la ejecución interactiva (TTY); `--non-interactive` omite los intentos de renovación.

    Cuando una renovación de OAuth falla de forma permanente (por ejemplo, `refresh_token_reused`, `invalid_grant` o si un proveedor indica que es necesario volver a iniciar sesión), doctor informa de que se requiere una nueva autenticación y muestra el comando `openclaw models auth login --provider ...` exacto que debe ejecutarse.

    Doctor también informa de los perfiles de autenticación que no pueden utilizarse temporalmente debido a periodos de espera breves (límites de frecuencia, tiempos de espera o fallos de autenticación) o a desactivaciones más prolongadas (fallos de facturación o crédito).

    Los perfiles heredados de OAuth de Codex cuyos tokens se encuentran en el llavero de macOS (incorporación anterior al diseño con archivo auxiliar) solo los repara doctor. Ejecute `openclaw doctor --fix` una vez desde un terminal interactivo para migrar directamente los tokens heredados respaldados por el llavero a `auth-profiles.json`; después, los turnos integrados (Telegram, cron, envío a subagentes) los resolverán como perfiles canónicos de OAuth de OpenAI.

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si se establece `hooks.gmail.model`, doctor valida la referencia del modelo con respecto al catálogo y la lista de permitidos, y advierte cuando no se podrá resolver o no esté permitida.
  </Accordion>
  <Accordion title="7. Reparación de imágenes del entorno aislado">
    Cuando el aislamiento está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar una imagen o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalaciones de plugins">
    En el modo `openclaw doctor --fix` / `openclaw doctor --repair`, doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw: raíces obsoletas de dependencias generadas, directorios antiguos de preparación de instalaciones, residuos locales de paquetes procedentes de código anterior de reparación de dependencias de plugins incluidos y copias npm administradas huérfanas o recuperadas de plugins `@openclaw/*` incluidos que puedan ocultar el manifiesto incluido actual. Doctor también vuelve a enlazar el paquete `openclaw` del host en los plugins npm administrados que declaran `peerDependencies.openclaw`, para que las importaciones de ejecución locales al paquete, como `openclaw/plugin-sdk/*`, sigan resolviéndose después de actualizaciones o reparaciones de npm.

    Doctor también puede reinstalar plugins descargables ausentes cuando la configuración hace referencia a ellos, pero el registro local de plugins no puede encontrarlos (`plugins.entries` material, ajustes configurados de canales/proveedores/búsqueda y entornos de ejecución de agentes configurados). Durante las actualizaciones de paquetes, doctor evita reinstalar paquetes de plugins mientras se sustituye el paquete principal; vuelva a ejecutar `openclaw doctor --fix` después de la actualización si un plugin configurado aún necesita recuperarse. Fuera de la excepción de inicio de imágenes de contenedor indicada a continuación, el inicio del gateway y la recarga de la configuración no ejecutan la reparación de paquetes; las instalaciones de plugins siguen siendo tareas explícitas de doctor, instalación o actualización.

    El inicio del gateway en contenedores tiene una excepción de actualización limitada: cuando `openclaw gateway run` se inicia con una versión nueva de OpenClaw, ejecuta migraciones de estado seguras y la convergencia existente de plugins posterior al núcleo antes de estar listo, y luego registra un punto de control por versión. Esta fase de inicio puede limpiar registros obsoletos de plugins incluidos, reparar enlaces locales de plugins, reinstalar paquetes de plugins configurados cuando lo requiera la ruta de convergencia y comprobar las cargas útiles de los plugins activos. Si el inicio no puede efectuar la reparación de forma segura, ejecute una vez la misma imagen con `openclaw doctor --fix` sobre el mismo estado y la misma configuración montados antes de reiniciar el contenedor con normalidad.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway e indicaciones de limpieza">
    Doctor detecta servicios heredados del gateway (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw utilizando el puerto actual del gateway. También puede buscar servicios adicionales similares al gateway y mostrar indicaciones de limpieza. Los servicios del gateway de OpenClaw con nombre de perfil se consideran elementos de primera clase y no se señalan como «adicionales».

    En Linux, si falta el servicio del gateway a nivel de usuario, pero existe un servicio del gateway de OpenClaw a nivel del sistema, doctor no instala automáticamente un segundo servicio a nivel de usuario. Examínelo con `openclaw gateway status --deep` o `openclaw doctor --deep` y, a continuación, elimine el duplicado o establezca `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema gestione el ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de Matrix durante el inicio">
    Cuando una cuenta de canal de Matrix tiene una migración de estado heredado pendiente o ejecutable, doctor (en el modo `--fix` / `--repair`) crea una instantánea previa a la migración y, a continuación, ejecuta los pasos de migración con el mejor esfuerzo posible: la migración del estado heredado de Matrix y la preparación del estado cifrado heredado. Ningún paso es fatal; los errores se registran y el inicio continúa. En el modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y divergencia de autenticación">
    Doctor examina el estado del emparejamiento de dispositivos como parte de la comprobación de estado normal e informa de:

    - solicitudes pendientes de primer emparejamiento
    - actualizaciones pendientes de rol o ámbito para dispositivos ya emparejados
    - reparaciones de discrepancias de claves públicas en las que el identificador del dispositivo aún coincide, pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos ámbitos se desvían de la línea base de emparejamiento aprobada
    - entradas locales en caché de tokens de dispositivos para la máquina actual anteriores a una rotación del token en el gateway o que contienen metadatos de ámbito obsoletos

    Doctor no aprueba automáticamente las solicitudes de emparejamiento ni rota automáticamente los tokens de dispositivos. Muestra los pasos siguientes exactos:

    - examinar las solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto distingue el primer emparejamiento de las actualizaciones pendientes de roles o ámbitos y de la divergencia de tokens obsoletos o de identidad del dispositivo, y soluciona el problema habitual de «ya está emparejado, pero aún se indica que se requiere emparejamiento».

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite una nota de seguridad solo cuando encuentra una advertencia, como un proveedor abierto a mensajes directos sin una lista de permitidos o una política configurada de forma peligrosa. Utilice `openclaw security audit` para consultar el inventario de seguridad completo.
  </Accordion>
  <Accordion title="10. Permanencia de systemd (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, doctor garantiza que la permanencia esté habilitada para que el gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y TaskFlows)">
    Doctor muestra problemas y acciones para el agente predeterminado, no un inventario del estado correcto:

    - **Skills**: enumera los nombres de Skills permitidas pero no utilizables; use `openclaw skills check` para consultar los detalles de los requisitos y los recuentos completos.
    - **Plugins**: informa únicamente de los identificadores de plugins con errores; use `openclaw plugins list` para consultar el inventario de plugins cargados, importados, deshabilitados e incluidos.
    - **Advertencias de compatibilidad de plugins**: señala los plugins que presentan problemas de compatibilidad con el entorno de ejecución actual.
    - **Diagnósticos de plugins**: muestra todas las advertencias o errores emitidos por el registro de plugins durante la carga.
    - **Recuperación de TaskFlow**: muestra los TaskFlows administrados sospechosos que requieren inspección manual o cancelación.
    - **CLI de Claude**: informa únicamente de problemas con el binario, la autenticación, el perfil, el espacio de trabajo o el directorio del proyecto; se omiten los detalles de las comprobaciones correctas.

  </Accordion>
  <Accordion title="11b. Tamaño de los archivos de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo, `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto insertados) están cerca del presupuesto de caracteres configurado o lo superan. Informa, por archivo, del recuento de caracteres sin procesar frente al insertado, el porcentaje de truncamiento, la causa del truncamiento (`max/file` o `max/total`) y el total de caracteres insertados como fracción del presupuesto total. Cuando los archivos están truncados o cerca del límite, doctor muestra consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Autocompletado del shell">
    Doctor comprueba si el autocompletado mediante tabulación está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell utiliza un patrón de completado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida con archivo en caché.
    - Si el completado está configurado en el perfil, pero falta el archivo de caché, doctor regenera automáticamente la caché.
    - Si no hay ningún completado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecute `openclaw completion --write-state` para regenerar manualmente la caché.

  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal que falta, también elimina la configuración pendiente específica del canal que hacía referencia a ese plugin: entradas de `channels.<id>`, destinos de Heartbeat que nombraban el canal y anulaciones de `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway en los que el entorno de ejecución del canal ya no existe, pero la configuración aún solicita al Gateway que se vincule a él.
  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de la autenticación mediante token del Gateway local.

    - Si el modo de token requiere un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado mediante SecretRef, pero no está disponible, doctor muestra una advertencia y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos flujos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo inmediato del entorno de ejecución.

    - `openclaw doctor --fix` utiliza el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para las reparaciones específicas de la configuración.
    - Ejemplo: la reparación de `@username` de Telegram `allowFrom` / `groupAllowFrom` intenta utilizar las credenciales configuradas del bot cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef, pero no está disponible en la ruta de comandos actual, doctor informa de que la credencial está configurada pero no disponible y omite la resolución automática en lugar de bloquearse o indicar incorrectamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado y reinicio del Gateway">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece que no funciona correctamente.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda en memoria">
    Doctor comprueba si el proveedor de embeddings configurado para la búsqueda en memoria está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y puede iniciarse. Si no es así, muestra instrucciones para solucionarlo, incluido `npm install -g @tobilu/qmd` (o el equivalente de Bun), y una opción para especificar manualmente la ruta del binario.
    - **Proveedor local explícito**: comprueba si hay un archivo de modelo local o una URL reconocida de un modelo remoto o descargable. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API en el entorno o en el almacén de autenticación. Si falta, muestra sugerencias prácticas para solucionarlo.
    - **Proveedor automático heredado**: trata `memorySearch.provider: "auto"` como OpenAI, comprueba la preparación de OpenAI y `doctor --fix` lo reescribe como `provider: "openai"`.

    Cuando está disponible el resultado almacenado en caché de una comprobación del Gateway (el Gateway estaba en buen estado en el momento de la comprobación), doctor coteja su resultado con la configuración visible para la CLI e indica cualquier discrepancia. Doctor no inicia una nueva comprobación de embeddings en la ruta predeterminada; utilice el comando de estado detallado de la memoria cuando desee comprobar un proveedor en tiempo real.

    Utilice `openclaw memory status --deep` para verificar la preparación de los embeddings durante la ejecución.

  </Accordion>
  <Accordion title="14. Advertencias sobre el estado de los canales">
    Si el Gateway está en buen estado, doctor ejecuta una comprobación del estado de los canales e informa de las advertencias junto con las correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de la configuración del supervisor">
    Doctor comprueba si a la configuración instalada del supervisor (launchd/systemd/schtasks) le faltan valores predeterminados o si están obsoletos (por ejemplo, las dependencias network-online y el retraso de reinicio de systemd). Cuando detecta una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio o la tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --fix` aplica las correcciones recomendadas sin solicitar confirmación (`--repair` es un alias).
    - `openclaw doctor --fix --force` sobrescribe las configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del Gateway. Sigue informando del estado del servicio y ejecutando reparaciones no relacionadas con el servicio, pero omite la instalación, el inicio, el reinicio y la inicialización del servicio, las reescrituras de la configuración del supervisor y la limpieza de servicios heredados, porque un supervisor externo controla ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos del comando o del punto de entrada mientras la unidad systemd correspondiente del Gateway está activa. También ignora las unidades adicionales inactivas, no heredadas y similares al Gateway durante el análisis de servicios duplicados, de modo que los archivos de servicios complementarios no generen avisos de limpieza innecesarios.
    - Si la autenticación mediante token requiere un token y `gateway.auth.token` está gestionado mediante SecretRef, la instalación o reparación del servicio por parte de doctor valida el SecretRef, pero no conserva los valores resueltos del token en texto sin formato en los metadatos del entorno del servicio del supervisor.
    - Doctor detecta los valores gestionados de `.env` o respaldados por SecretRef que las instalaciones antiguas de LaunchAgent, systemd o Tarea programada de Windows incorporaron directamente en el entorno del servicio, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente del entorno de ejecución en lugar de hacerlo desde la definición del supervisor.
    - Doctor detecta cuando el comando del servicio aún fija un `--port` antiguo después de que cambie `gateway.port` y reescribe los metadatos del servicio para usar el puerto actual.
    - Si la autenticación mediante token requiere un token y el SecretRef del token configurado no se puede resolver, doctor bloquea la ruta de instalación o reparación y proporciona instrucciones prácticas.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación o reparación hasta que se defina explícitamente el modo.
    - Para las unidades systemd de usuario en Linux, las comprobaciones de discrepancias de tokens de doctor incluyen tanto las fuentes `Environment=` como `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
    - Las reparaciones de servicios de doctor se niegan a reescribir, detener o reiniciar un servicio del Gateway desde un binario antiguo de OpenClaw cuando la última escritura de la configuración se realizó con una versión más reciente. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre es posible forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnóstico del entorno de ejecución y del puerto del Gateway">
    Doctor inspecciona el entorno de ejecución del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado, pero no se está ejecutando realmente. También comprueba si hay conflictos de puertos en el puerto del Gateway (predeterminado: `18789`) e informa de las causas probables (el Gateway ya se está ejecutando, túnel SSH).
  </Accordion>
  <Accordion title="17. Prácticas recomendadas para el entorno de ejecución del Gateway">
    Doctor advierte cuando el servicio del Gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Bun no puede abrir el almacén de estado `node:sqlite` de OpenClaw, por lo que las reparaciones migran los servicios heredados de Bun a Node. Las rutas de los gestores de versiones pueden dejar de funcionar después de las actualizaciones porque el servicio no carga la inicialización del shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados utilizan una PATH canónica del sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar la PATH del shell interactivo, de modo que los binarios del sistema gestionados por Homebrew sigan disponibles mientras que los directorios de Volta, asdf, fnm, pnpm y otros gestores de versiones no cambien qué procesos secundarios de Node se resuelven. Los servicios de Linux siguen conservando las raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y los directorios estables de binarios de usuario, pero los directorios alternativos inferidos de gestores de versiones solo se escriben en la PATH del servicio cuando esos directorios existen en el disco.

  </Accordion>
  <Accordion title="18. Escritura de la configuración y metadatos del asistente">
    Doctor conserva todos los cambios de configuración y registra los metadatos del asistente para dejar constancia de la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos sobre el espacio de trabajo (copia de seguridad y sistema de memoria)">
    Doctor sugiere un sistema de memoria para el espacio de trabajo cuando falta y muestra un consejo sobre copias de seguridad si el espacio de trabajo aún no está bajo el control de git.

    Consulte [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa sobre la estructura del espacio de trabajo y las copias de seguridad con git (se recomienda un repositorio privado de GitHub o GitLab).

  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
