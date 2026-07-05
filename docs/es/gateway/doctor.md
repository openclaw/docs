---
read_when:
    - Agregar o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-07-05T11:18:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f949b29dcede364149aead58b4117f1e0f16461de155061c0697abd823b95733
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado de salud y proporciona pasos de reparación accionables.

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

    Acepta los valores predeterminados sin solicitar confirmación (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando correspondan).

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

    Ejecuta comprobaciones de salud estructuradas para CI o automatización previa. Solo lectura: sin
    solicitudes, reparaciones, migraciones, reinicios ni escrituras de estado.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Ejecuta sin solicitudes y aplica solo migraciones seguras (normalización de configuración +
    movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren
    confirmación humana. Las migraciones de estado heredado siguen ejecutándose automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analiza los servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Para revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Modo lint de solo lectura

`openclaw doctor --lint` es el equivalente orientado a automatización de `openclaw doctor --fix`. Ambos ejecutan las mismas comprobaciones de salud; solo cambia la postura:

| Modo                     | Solicitudes | Escribe configuración/estado | Salida                         | Úsalo para                                   |
| ------------------------ | ----------- | ---------------------------- | ------------------------------ | ------------------------------------------- |
| `openclaw doctor`        | sí          | no                           | informe de salud amigable      | una persona comprobando el estado           |
| `openclaw doctor --fix`  | a veces     | sí, con política de reparación | registro de reparación amigable | aplicar reparaciones aprobadas              |
| `openclaw doctor --lint` | no          | no                           | hallazgos estructurados        | CI, preflight y puertas de revisión         |

Las comprobaciones de salud pueden proporcionar una implementación opcional de `repair()`; `doctor --fix` la aplica cuando está presente y, de lo contrario, recurre al flujo de reparación heredado de doctor. El contrato separa `detect()` (informa hallazgos) de `repair()` (informa cambios/diffs/efectos secundarios), lo que mantiene abierto un camino para un futuro `doctor --fix --dry-run` sin convertir las comprobaciones lint en planificadores de mutación.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Campos de salida JSON:

- `ok`: si algún hallazgo alcanzó el umbral de gravedad seleccionado
- `checksRun` / `checksSkipped`: recuentos (omitidos por perfil, `--only` o `--skip`)
- `findings`: diagnósticos estructurados con `checkId`, `severity`, `message` y los opcionales `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Códigos de salida:

| Código | Significado                                                        |
| ------ | ------------------------------------------------------------------ |
| `0`    | no hay hallazgos en el umbral seleccionado o por encima de él      |
| `1`    | uno o más hallazgos alcanzaron el umbral seleccionado              |
| `2`    | fallo de comando/runtime antes de que pudieran emitirse hallazgos  |

Opciones:

- `--severity-min info|warning|error` (predeterminado `warning`): controla tanto lo que se imprime como lo que provoca una salida distinta de cero.
- `--all`: ejecuta todas las comprobaciones registradas, incluidas las comprobaciones opt-in excluidas del conjunto de automatización predeterminado.
- `--only <id>` (repetible): ejecuta solo los identificadores de comprobación nombrados; un identificador desconocido se informa como un hallazgo de error.
- `--skip <id>` (repetible): excluye una comprobación mientras mantiene activo el resto de la ejecución.
- `--json`, `--severity-min`, `--all`, `--only` y `--skip` requieren `--lint`; las ejecuciones simples de `openclaw doctor` y `--fix` las rechazan.

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Actualización opcional previa para instalaciones git (solo interactivo).
    - Comprobación de frescura del protocolo de la interfaz (recompila Control UI cuando el esquema de protocolo es más nuevo).
    - Comprobación de salud + solicitud de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalización de configuración para formas de valores heredadas.
    - Migración de configuración de conversación desde campos planos heredados `talk.*` hacia `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura de proveedor OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migración de proveedor/perfil heredado de OpenAI Codex (`openai-codex` → `openai`) y advertencias de sombreado para `models.providers.openai-codex` obsoleto.
    - Comprobación de prerrequisitos TLS de OAuth para perfiles OAuth de OpenAI Codex.
    - Advertencias de allowlist de plugin/herramienta cuando `plugins.allow` es restrictivo pero la política de herramientas aún pide comodín o herramientas propiedad de plugins.
    - Migración de estado heredado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves de contrato de manifiesto de plugin heredado (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos de fallback de Webhook con `notify: true`).
    - Reparación de pin de runtime de Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) en `agents.defaults`, `agents.list[]` y `models.providers.*` (incluidas entradas por modelo).
    - Limpieza de configuración de plugins obsoleta cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas de plugins se conservan como configuración de contención inerte.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompt creadas por builds 2026.4.24 afectadas.
    - Detección de tombstones de recuperación por reinicio de subagentes bloqueados, con soporte de `--fix` para borrar flags obsoletos de recuperación abortada de modo que el arranque no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Salud de autenticación de modelos: comprueba la expiración de OAuth, puede renovar tokens próximos a expirar e informa estados de cooldown/deshabilitado de perfiles de autenticación.

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicios heredados y detección de Gateway adicional.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime de Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (probadas desde el Gateway en ejecución).
    - Las comprobaciones de permisos específicas de canal viven bajo `openclaw channels capabilities`; por ejemplo, los permisos de canal de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp para salud degradada del event loop del Gateway con clientes TUI locales aún en ejecución; `--fix` detiene solo clientes TUI locales verificados.
    - Reparación de rutas Codex para referencias de modelo heredadas `openai-codex/*` en modelos primarios, fallbacks, modelos de generación de imágenes/videos, sobrescrituras de Heartbeat/subagente/Compaction, hooks, sobrescrituras de modelo de canal y pins de ruta de sesión; `--fix` las reescribe a `openai/*`, migra perfiles/orden de autenticación `openai-codex:*` a `openai:*`, elimina pins obsoletos de runtime de sesión/agente completo y deja las referencias canónicas de agente OpenAI en el harness Codex predeterminado.
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy incrustado para servicios de Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de prácticas recomendadas de runtime de Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisión de puerto de Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generación de token cuando no existe ninguna fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño del archivo de bootstrap del espacio de trabajo (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa skills permitidas con bins, entorno, configuración o requisitos de SO faltantes, y `--fix` puede deshabilitar skills no disponibles en `skills.entries`.
    - Comprobación de estado de completado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste de workspace pnpm, recursos de interfaz faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno histórico y restablecimiento de la interfaz Dreams

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de grounded dreaming. Estas usan métodos RPC de estilo doctor del Gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

| Acción         | Qué hace                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | Analiza archivos históricos `memory/YYYY-MM-DD.md` en el workspace activo, ejecuta la pasada de diario REM grounded y escribe entradas reversibles de relleno histórico en `DREAMS.md`. |
| Reset          | Elimina solo las entradas de diario de relleno histórico marcadas de `DREAMS.md`.                                                                                                        |
| Clear Grounded | Elimina solo entradas staged de corto plazo únicamente grounded de la reproducción histórica que aún no han acumulado recuerdo en vivo ni soporte diario.                                |

Ninguna de estas acciones edita `MEMORY.md`, ejecuta migraciones doctor completas ni coloca por sí sola candidatos grounded en el almacén de promoción de corto plazo en vivo. Para alimentar la reproducción histórica grounded en la ruta normal de promoción profunda, usa en su lugar el flujo de la CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso coloca candidatos duraderos grounded en el almacén de dreaming de corto plazo mientras `DREAMS.md` permanece como superficie de revisión.

## Comportamiento detallado y justificación

  <AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones con git)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Doctor normaliza formas de valores heredadas al esquema actual. La configuración actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, con la configuración de voz en tiempo real en `talk.realtime.*`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores, y reescribe los selectores heredados de nivel superior en tiempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa entradas comodín o entradas de herramientas propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas de plugins que realmente se cargan; no omite la lista de permisos exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene una clave obsoleta con una migración activa, otros comandos se niegan a ejecutarse y te piden ejecutar `openclaw doctor`. Doctor explica qué claves heredadas se encontraron, muestra la migración que aplicó y reescribe `~/.openclaw/openclaw.json` con el esquema actualizado. El inicio de Gateway rechaza formatos de configuración heredados y te pide ejecutar `openclaw doctor --fix`; no reescribe `openclaw.json` al iniciar. Las migraciones del almacén de trabajos Cron también las gestiona `openclaw doctor --fix`.

    <Note>
      Doctor solo conserva migraciones automáticas durante aproximadamente dos meses después de que una
      clave se retira. Las claves heredadas más antiguas (por ejemplo, las originales
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` de nivel superior o `identity` de nivel superior
      de la forma de configuración anterior a múltiples agentes) ya no tienen una ruta de migración;
      la configuración que las usa ahora falla la validación en lugar de reescribirse. Corrige
      esas claves manualmente según la referencia de configuración actual antes de que doctor
      pueda continuar.
    </Note>

    Migraciones activas:

    | Clave heredada                                                                                    | Clave actual                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | eliminado (WebChat está retirado)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (y por cuenta)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredados        | `talk.provider` + `talk.providers.<provider>`                               |
    | selectores heredados de nivel superior en tiempo real de Talk (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | campos de hablante TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (todos los canales excepto Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (todos los canales, incluido Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (el inicio de Gateway también omite proveedores cuyo `api` es un valor de enum futuro/desconocido en lugar de fallar en modo cerrado) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | eliminado (ajuste heredado del relé de la extensión de Chrome)                             |
    | `mcp.servers.*.type` (alias nativos de la CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | eliminado (el servidor de aplicación Codex siempre mantiene nativas las herramientas de espacio de trabajo nativas de Codex) |
    | `commands.modelsWrite`                                                                           | eliminado (`/models add` está obsoleto)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | eliminado (`NO_REPLY` exacto ya no se reescribe como texto alternativo visible)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | eliminado (OpenClaw posee el prompt del sistema generado)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | eliminado (usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de modelos/proveedores lentos, mantenidos por debajo del límite de tiempo de espera de agente/ejecución) |
    | `memorySearch` de nivel superior                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (cualquier nivel)                                                            | eliminado (los índices de memoria viven en cada base de datos de agente)                       |
    | `heartbeat` de nivel superior                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | ids de política `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | eliminado (obsoleto)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Las filas `plugins.entries.voice-call.config.*` anteriores las normaliza
      el propio Plugin Voice Call en cada carga de configuración, no `openclaw
      doctor`. El plugin también registra una advertencia de inicio que apunta a `openclaw
      doctor --fix`, pero doctor actualmente no reescribe
      `openclaw.json` para estas claves; la normalización propia del plugin es lo que
      aplica el cambio en tiempo de ejecución.
    </Note>

    Guía de cuentas predeterminadas para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento alternativo puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` se establece en un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Sobrescrituras del proveedor OpenCode">
    Si has agregado `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, sobrescribe el catálogo OpenCode integrado de `openclaw/plugin-sdk/llm`. Eso puede forzar modelos hacia la API incorrecta o poner los costes a cero. Doctor advierte para que puedas eliminar la sobrescritura y restaurar el enrutamiento de API por modelo + costes.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de MCP de Chrome">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP local del host (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` eliminado).

    Doctor también audita la ruta Chrome MCP local del host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles de conexión automática predeterminados
    - comprueba la versión de Chrome detectada y advierte cuando es inferior a Chrome 144
    - te recuerda que habilites la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. El MCP de Chrome local al host sigue requiriendo un navegador basado en Chromium 144+ en el host de gateway/nodo, ejecutándose localmente, con la depuración remota habilitada y el primer aviso de consentimiento de conexión aprobado en el navegador.

    La preparación aquí solo cubre los requisitos previos de conexión local. La sesión existente mantiene los límites actuales de ruta del MCP de Chrome; las rutas avanzadas como `responsebody`, la exportación de PDF, la interceptación de descargas y las acciones por lotes siguen requiriendo un navegador administrado o un perfil CDP sin procesar. Esta comprobación no se aplica a Docker, sandbox, navegador remoto u otros flujos sin interfaz, que siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS de OAuth">
    Cuando se configura un perfil de OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor imprime instrucciones de corrección específicas de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta aunque el Gateway esté en buen estado.
  </Accordion>
  <Accordion title="2e. Sobrescrituras del proveedor OAuth de Codex">
    Si antes agregaste configuraciones de transporte heredadas de OpenAI en `models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esas configuraciones de transporte antiguas junto con OAuth de Codex para que puedas eliminar o reescribir la sobrescritura de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y las sobrescrituras solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba si hay refs de modelo heredadas `openai-codex/*`. El enrutamiento del arnés nativo de Codex usa refs de modelo canónicas `openai/*`; los turnos de agente de OpenAI pasan por el arnés app-server de Codex en lugar de la ruta del proveedor OpenAI de OpenClaw.

    En modo `--fix` / `--repair`, doctor reescribe las refs afectadas de agentes predeterminados y por agente, incluidos modelos principales, reservas, modelos de generación de imagen/video, sobrescrituras de Heartbeat/subagente/Compaction, hooks, sobrescrituras de modelo de canal y estado de ruta de sesión persistido obsoleto:

    - `openai-codex/gpt-*` pasa a ser `openai/gpt-*`.
    - La intención de Codex se mueve a entradas `agentRuntime.id: "codex"` con alcance de proveedor/modelo para las refs de modelo de agente reparadas.
    - La configuración de runtime de agente completo obsoleta y los pines de runtime de sesión persistidos se eliminan porque la selección de runtime tiene alcance de proveedor/modelo.
    - La política de runtime de proveedor/modelo existente se conserva salvo que la ref de modelo heredada reparada necesite enrutamiento de Codex para mantener la ruta de autenticación antigua.
    - Las listas de reservas de modelo existentes se conservan con sus entradas heredadas reescritas; las configuraciones por modelo copiadas se mueven de la clave heredada a la clave canónica `openai/*`.
    - Los pines de `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de reserva y perfil de autenticación de sesión persistida se reparan en todos los almacenes de sesión de agente descubiertos.
    - Doctor repara por separado los pines obsoletos `agentRuntime.id: "codex-cli"` (un id de runtime heredado distinto) a `"codex"` en las entradas de modelo de `agents.defaults`, `agents.list[]` y `models.providers.*`.
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat".
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx".

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también examina los almacenes de sesión de agente descubiertos en busca de estado de ruta obsoleto creado automáticamente después de mover modelos configurados o el runtime fuera de una ruta propiedad de un Plugin como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto creado automáticamente, como pines de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, ids de arnés fijados, vinculaciones de sesión de CLI y sobrescrituras automáticas de perfil de autenticación cuando su ruta propietaria ya no está configurada. Las elecciones explícitas de usuario o heredadas de modelo de sesión se reportan para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no esté prevista.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño de disco)">
    Doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones: de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio de agente: de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys): de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`) a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emite advertencias cuando deja carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente las sesiones heredadas + el directorio de agente al iniciar, para que el historial/autenticación/modelos lleguen a la ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedor de conversación/mapa de proveedores compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor examina todos los manifiestos de Plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto in situ. Esta migración es idempotente; si `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacén de Cron heredado">
    Doctor también comprueba el almacén de trabajos de Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formas antiguas de trabajos que el programador aún acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega de `provider` de payload → `delivery.channel` explícito
    - trabajos heredados de reserva de Webhook `notify: true` → entrega Webhook explícita desde `cron.webhook` cuando está configurado; los trabajos de anuncio conservan su entrega por chat y reciben `delivery.completionDestination`. Cuando `cron.webhook` no está configurado, el marcador inerte de nivel superior `notify` se elimina para trabajos sin destino (se conserva la entrega existente, incluido anuncio), ya que la entrega en runtime nunca lo lee.

    El Gateway también sanea filas de Cron malformadas en tiempo de carga para que los trabajos válidos sigan ejecutándose. Las filas malformadas sin procesar se copian a `jobs-quarantine.json` junto al almacén activo antes de eliminarlas de `jobs.json`; doctor reporta las filas en cuarentena para que puedas revisarlas o repararlas manualmente.

    El inicio del Gateway normaliza la proyección de runtime e ignora el marcador de nivel superior `notify`, pero deja la configuración de Cron persistida para que doctor la repare. Cuando `cron.webhook` no está configurado, doctor elimina el marcador inerte para trabajos sin destino de migración (`delivery.mode` ausente/ninguno, un destino de Webhook inutilizable o entrega existente de anuncio/chat), dejando intacta la entrega existente, por lo que las ejecuciones repetidas de `doctor --fix` ya no vuelven a advertir sobre el mismo trabajo. Si `cron.webhook` está configurado pero no es una URL HTTP(S) válida, doctor aún advierte y deja el marcador para que puedas corregir la URL.

    En Linux, doctor también advierte cuando el crontab del usuario aún invoca el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local al host no es mantenido por el OpenClaw actual y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta de crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor examina cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos dejados cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado, reporta: la ruta, PID, si el PID sigue vivo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto, metadatos de propietario malformados, más de 30 minutos, o un PID vivo que se ha demostrado que pertenece a un proceso que no es de OpenClaw). En modo `--fix` / `--repair`, elimina automáticamente los bloqueos con propietarios muertos, huérfanos, reciclados, malformados-antiguos o no pertenecientes a OpenClaw. Los bloqueos antiguos que aún pertenecen a un proceso vivo de OpenClaw se reportan pero se dejan en su lugar para que doctor no interrumpa un escritor de transcripción activo.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor examina archivos JSONL de sesión de agente en busca de la forma de rama duplicada creada por el bug de reescritura de transcripciones de prompt del 2026.4.24: un turno de usuario abandonado con contexto de runtime interno de OpenClaw más un hermano activo que contiene el mismo prompt de usuario visible. En modo `--fix` / `--repair`, doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración, salvo que tengas copias de seguridad en otro lugar.

    Doctor comprueba:

    - **Directorio de estado ausente**: advierte sobre pérdida catastrófica de estado, solicita recrear el directorio y te recuerda que no puede recuperar datos ausentes.
    - **Permisos del directorio de estado**: verifica la capacidad de escritura; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD/eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Directorio de estado volátil en Linux**: advierte cuando el estado se resuelve a `tmpfs` o `ramfs`, porque las sesiones, credenciales, configuración y estado de SQLite (con archivos laterales WAL/journal) desaparecen al reiniciar. Los montajes `overlay` de Docker no se marcan intencionalmente porque sus capas de escritura persisten entre reinicios del host mientras el contenedor permanece.
    - **Directorios de sesión ausentes**: `sessions/` y el directorio de almacén de sesiones son necesarios para persistir historial y evitar bloqueos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas de sesión recientes tienen archivos de transcripción ausentes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio, o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/mundo y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación del modelo (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o han caducado, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta setup-token de Anthropic. Los avisos de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización OAuth falla de forma permanente (por ejemplo, `refresh_token_reused`, `invalid_grant` o un proveedor que te indica que vuelvas a iniciar sesión), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa sobre perfiles de autenticación que son temporalmente inutilizables debido a enfriamientos breves (límites de frecuencia/tiempos de espera/fallos de autenticación) o desactivaciones más largas (fallos de facturación/crédito).

    Los perfiles OAuth heredados de Codex cuyos tokens viven en el llavero de macOS (incorporación anterior al diseño sidecar basado en archivos) solo los repara doctor. Ejecuta `openclaw doctor --fix` una vez desde una terminal interactiva para migrar los tokens heredados respaldados por el llavero en línea a `auth-profiles.json`; después de eso, los turnos incrustados (Telegram, cron, despacho de subagentes) los resuelven como perfiles OAuth canónicos de OpenAI.

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está definido, doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandbox está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugins">
    Doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`: raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, residuos locales de paquetes de código anterior de reparación de dependencias de plugins incluidos, y copias npm administradas huérfanas o recuperadas de plugins `@openclaw/*` incluidos que pueden eclipsar el manifiesto incluido actual. Doctor también vuelve a enlazar el paquete host `openclaw` en plugins npm administrados que declaran `peerDependencies.openclaw`, de modo que las importaciones de runtime locales del paquete como `openclaw/plugin-sdk/*` sigan resolviéndose después de actualizaciones o reparaciones de npm.

    Doctor también puede reinstalar plugins descargables faltantes cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos (`plugins.entries` materiales, configuración de canal/proveedor/búsqueda configurada, runtimes de agente configurados). Durante las actualizaciones de paquetes, doctor evita ejecutar la reparación de plugins del gestor de paquetes mientras se está sustituyendo el paquete principal; ejecuta `openclaw doctor --fix` de nuevo después de la actualización si un plugin configurado aún necesita recuperación. El inicio de Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto de gateway actual. También puede escanear servicios adicionales parecidos a gateway e imprimir sugerencias de limpieza. Los servicios gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "adicionales".

    En Linux, si falta el servicio gateway de nivel de usuario pero existe un servicio gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o define `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema es propietario del ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredado pendiente o procesable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor inspecciona el estado de emparejamiento de dispositivos como parte de la pasada normal de salud, informando:

    - solicitudes pendientes de emparejamiento por primera vez
    - actualizaciones pendientes de rol o alcance para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados a los que les falta un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían fuera de la línea base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado de gateway o contienen metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. Imprime los siguientes pasos exactos:

    - inspecciona solicitudes pendientes con `openclaw devices list`
    - aprueba la solicitud exacta con `openclaw devices approve <requestId>`
    - rota un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - elimina y vuelve a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto distingue el emparejamiento por primera vez de las actualizaciones pendientes de rol/alcance y de la deriva obsoleta de token/identidad de dispositivo, cerrando el hueco común de "ya emparejado pero aún aparece emparejamiento requerido".

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como servicio de usuario systemd, doctor garantiza que linger esté habilitado para que el gateway permanezca activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y TaskFlows)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: recuentos de Skills elegibles, con requisitos faltantes y bloqueadas por la lista de permitidos.
    - **Estado de Plugins**: recuentos de plugins habilitados/deshabilitados/con errores; lista los IDs de plugins para cualquier error; informa capacidades de plugins incluidos.
    - **Advertencias de compatibilidad de Plugins**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugins**: expone cualquier advertencia o error en tiempo de carga emitido por el registro de plugins.
    - **Recuperación de TaskFlow**: expone TaskFlows administrados sospechosos que necesitan inspección manual o cancelación.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa de truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos están truncados o cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulación está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal faltante, también elimina la configuración colgante con alcance de canal que hacía referencia a ese plugin: entradas `channels.<id>`, objetivos de Heartbeat que nombraban el canal, y anulaciones `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque de Gateway donde el runtime del canal desapareció pero la configuración aún pide al gateway vincularse a él.
  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación de Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token local de gateway.

    - Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está administrado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento runtime de fallo rápido.

    - `openclaw doctor --fix` usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia status para reparaciones de configuración dirigidas.
    - Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` `@username` de Telegram intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token de bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de salud de Gateway + reinicio">
    Doctor ejecuta una comprobación de salud y ofrece reiniciar el gateway cuando parece no estar saludable.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda de memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y proveedor configurados:

    - **Backend QMD**: sondea si el binario `qmd` está disponible y puede iniciarse. Si no, imprime guía de corrección que incluye `npm install -g @tobilu/qmd` (o el equivalente de Bun) y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático heredado**: trata `memorySearch.provider: "auto"` como OpenAI, comprueba la preparación de OpenAI, y `doctor --fix` lo reescribe a `provider: "openai"`.

    Cuando hay disponible un resultado de sondeo de gateway en caché (el gateway estaba saludable en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping nuevo de embeddings en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canal">
    Si el gateway está saludable, doctor ejecuta un sondeo de estado de canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de configuración del supervisor">
    Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) en busca de valores predeterminados faltantes u obsoletos (por ejemplo dependencias systemd network-online y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea a los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --fix` aplica las correcciones recomendadas sin solicitudes (`--repair` es un alias).
    - `openclaw doctor --fix --force` sobrescribe las configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio de Gateway. Sigue informando el estado del servicio y ejecutando reparaciones que no son de servicio, pero omite la instalación, el inicio, el reinicio y el bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo es propietario de ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos de comando/punto de entrada mientras la unidad systemd de Gateway correspondiente está activa. También ignora las unidades adicionales inactivas, no heredadas y similares a Gateway durante el escaneo de servicios duplicados, para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef, pero no persiste los valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
    - Doctor detecta valores de entorno de servicio gestionados mediante `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Tareas programadas de Windows incrustaron en línea, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de runtime en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de que cambia `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación con token requiere un token y el SecretRef de token configurado no se puede resolver, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades systemd de usuario en Linux, las comprobaciones de desviación de token de doctor incluyen fuentes `Environment=` y `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de Gateway desde un binario de OpenClaw más antiguo cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas de Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime de Gateway + diagnósticos de puerto">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado, pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto de Gateway (predeterminado `18789`) e informa causas probables (Gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Prácticas recomendadas del runtime de Gateway">
    Doctor advierte cuando el servicio de Gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales WhatsApp y Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH de sistema canónico (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH de la shell interactiva, de modo que los binarios de sistema gestionados por Homebrew sigan disponibles mientras Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambian qué procesos secundarios de Node se resuelven. Los servicios de Linux aún conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios estables de binarios de usuario, pero los directorios de respaldo adivinados de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y marca los metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de espacio de trabajo cuando falta e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa de la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
