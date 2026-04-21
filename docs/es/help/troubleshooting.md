---
read_when:
    - OpenClaw no funciona y necesitas la vía más rápida para solucionarlo
    - Quieres un flujo de triaje antes de profundizar en runbooks detallados
summary: Centro de solución de problemas de OpenClaw orientado por síntomas
title: Solución general de problemas
x-i18n:
    generated_at: "2026-04-21T05:15:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5d8c9f804084985c672c5a003ce866e8142ab99fe81abb7a0d38e22aea4b88
    source_path: help/troubleshooting.md
    workflow: 15
---

# Solución de problemas

Si solo tienes 2 minutos, usa esta página como punto de entrada de triaje.

## Primeros 60 segundos

Ejecuta esta secuencia exacta en orden:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Salida correcta en una línea:

- `openclaw status` → muestra los canales configurados y ningún error de autenticación evidente.
- `openclaw status --all` → el informe completo está presente y se puede compartir.
- `openclaw gateway probe` → el destino esperado del gateway es accesible (`Reachable: yes`). `Capability: ...` indica qué nivel de autenticación pudo demostrar la sonda, y `Read probe: limited - missing scope: operator.read` indica diagnóstico degradado, no un fallo de conexión.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...` plausible. Usa `--require-rpc` si también necesitas prueba de RPC con alcance de lectura.
- `openclaw doctor` → no hay errores de configuración/servicio que bloqueen.
- `openclaw channels status --probe` → si el gateway es accesible, devuelve el estado de transporte en vivo por cuenta más resultados de sonda/auditoría como `works` o `audit ok`; si el gateway no es accesible, el comando vuelve a resúmenes solo de configuración.
- `openclaw logs --follow` → actividad estable, sin errores fatales repetidos.

## 429 de Anthropic con contexto largo

Si ves:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
ve a [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Un backend local compatible con OpenAI funciona directamente pero falla en OpenClaw

Si tu backend local o autohospedado `/v1` responde a sondas directas pequeñas de
`/v1/chat/completions` pero falla en `openclaw infer model run` o en turnos
normales del agente:

1. Si el error menciona que `messages[].content` espera un string, establece
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Si el backend sigue fallando solo en los turnos del agente de OpenClaw, establece
   `models.providers.<provider>.models[].compat.supportsTools: false` y vuelve a intentarlo.
3. Si las llamadas directas mínimas siguen funcionando pero los prompts más grandes de OpenClaw hacen colapsar el backend, trata el problema restante como una limitación ascendente del modelo/servidor y continúa en el runbook detallado:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/es/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## La instalación de plugins falla por falta de openclaw extensions

Si la instalación falla con `package.json missing openclaw.extensions`, el paquete del plugin
está usando una forma antigua que OpenClaw ya no acepta.

Solución en el paquete del plugin:

1. Agrega `openclaw.extensions` a `package.json`.
2. Apunta las entradas a archivos runtime compilados (normalmente `./dist/index.js`).
3. Vuelve a publicar el plugin y ejecuta `openclaw plugins install <package>` otra vez.

Ejemplo:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Referencia: [Plugin architecture](/es/plugins/architecture)

## Árbol de decisión

```mermaid
flowchart TD
  A[OpenClaw no funciona] --> B{Qué es lo primero que falla}
  B --> C[No hay respuestas]
  B --> D[El Dashboard o la UI de Control no se conectan]
  B --> E[El Gateway no inicia o el servicio no está en ejecución]
  B --> F[El canal se conecta pero los mensajes no fluyen]
  B --> G[Cron o Heartbeat no se activaron o no entregaron]
  B --> H[El Node está emparejado pero falla la herramienta de cámara/canvas/pantalla/exec]
  B --> I[Falla la herramienta del navegador]

  C --> C1[/Sección Sin respuestas/]
  D --> D1[/Sección UI de Control/]
  E --> E1[/Sección Gateway/]
  F --> F1[/Sección Flujo del canal/]
  G --> G1[/Sección Automatización/]
  H --> H1[/Sección Herramientas de Node/]
  I --> I1[/Sección Navegador/]
```

<AccordionGroup>
  <Accordion title="Sin respuestas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    La salida correcta se ve así:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`
    - Tu canal muestra el transporte conectado y, donde se admite, `works` o `audit ok` en `channels status --probe`
    - El remitente aparece como aprobado (o la política de DM es open/allowlist)

    Firmas comunes en logs:

    - `drop guild message (mention required` → el filtrado por menciones bloqueó el mensaje en Discord.
    - `pairing request` → el remitente no está aprobado y espera aprobación de emparejamiento por DM.
    - `blocked` / `allowlist` en los logs del canal → el remitente, sala o grupo está filtrado.

    Páginas detalladas:

    - [/gateway/troubleshooting#no-replies](/es/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/es/channels/troubleshooting)
    - [/channels/pairing](/es/channels/pairing)

  </Accordion>

  <Accordion title="El Dashboard o la UI de Control no se conectan">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    La salida correcta se ve así:

    - `Dashboard: http://...` se muestra en `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`
    - No hay bucle de autenticación en los logs

    Firmas comunes en logs:

    - `device identity required` → HTTP/contexto no seguro no puede completar la autenticación del dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está permitido para el destino del gateway de la UI de Control.
    - `AUTH_TOKEN_MISMATCH` con sugerencias de reintento (`canRetryWithDeviceToken=true`) → puede producirse automáticamente un reintento de confianza con token de dispositivo.
    - Ese reintento con token en caché reutiliza el conjunto de alcances en caché almacenado con el token de dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos conservan en cambio el conjunto de alcances solicitado.
    - En la ruta asíncrona de la UI de Control de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo, por lo que un segundo reintento incorrecto concurrente ya puede mostrar `retry later`.
    - `too many failed authentication attempts (retry later)` desde un origen de navegador localhost → fallos repetidos desde ese mismo `Origin` se bloquean temporalmente; otro origen localhost usa un bucket separado.
    - `unauthorized` repetido después de ese reintento → token/contraseña incorrectos, incompatibilidad de modo de autenticación o token de dispositivo emparejado obsoleto.
    - `gateway connect failed:` → la UI apunta a la URL/puerto equivocados o a un gateway inaccesible.

    Páginas detalladas:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/es/gateway/authentication)

  </Accordion>

  <Accordion title="El Gateway no inicia o el servicio está instalado pero no en ejecución">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    La salida correcta se ve así:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`

    Firmas comunes en logs:

    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo del gateway es remoto, o al archivo de configuración le falta la marca de modo local y debe repararse.
    - `refusing to bind gateway ... without auth` → bind no loopback sin una ruta de autenticación válida del gateway (token/contraseña, o trusted-proxy donde esté configurado).
    - `another gateway instance is already listening` o `EADDRINUSE` → el puerto ya está ocupado.

    Páginas detalladas:

    - [/gateway/troubleshooting#gateway-service-not-running](/es/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/es/gateway/background-process)
    - [/gateway/configuration](/es/gateway/configuration)

  </Accordion>

  <Accordion title="El canal se conecta pero los mensajes no fluyen">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    La salida correcta se ve así:

    - El transporte del canal está conectado.
    - Las comprobaciones de emparejamiento/lista de permitidos pasan.
    - Las menciones se detectan cuando son necesarias.

    Firmas comunes en logs:

    - `mention required` → el filtrado por menciones de grupo bloqueó el procesamiento.
    - `pairing` / `pending` → el remitente del DM aún no está aprobado.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problema de permisos o token del canal.

    Páginas detalladas:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/es/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/es/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron o Heartbeat no se activaron o no entregaron">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    La salida correcta se ve así:

    - `cron.status` muestra que está habilitado con una próxima activación.
    - `cron runs` muestra entradas recientes `ok`.
    - Heartbeat está habilitado y no está fuera del horario activo.

    Firmas comunes en logs:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron está deshabilitado.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera del horario activo configurado.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene estructura en blanco o solo encabezados.
    - `heartbeat skipped` con `reason=no-tasks-due` → el modo de tareas de `HEARTBEAT.md` está activo pero todavía no venció ninguno de los intervalos de tareas.
    - `heartbeat skipped` con `reason=alerts-disabled` → toda la visibilidad de Heartbeat está deshabilitada (`showOk`, `showAlerts` y `useIndicator` están todos apagados).
    - `requests-in-flight` → el carril principal está ocupado; la activación de Heartbeat se aplazó.
    - `unknown accountId` → la cuenta de destino de entrega de Heartbeat no existe.

    Páginas detalladas:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/es/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/es/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/es/gateway/heartbeat)

    </Accordion>

    <Accordion title="El Node está emparejado pero falla la herramienta de cámara/canvas/pantalla/exec">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      La salida correcta se ve así:

      - El Node aparece como conectado y emparejado para el rol `node`.
      - Existe capacidad para el comando que estás invocando.
      - El estado de permisos está concedido para la herramienta.

      Firmas comunes en logs:

      - `NODE_BACKGROUND_UNAVAILABLE` → lleva la app de node al primer plano.
      - `*_PERMISSION_REQUIRED` → faltaba permiso del SO o fue denegado.
      - `SYSTEM_RUN_DENIED: approval required` → la aprobación de exec está pendiente.
      - `SYSTEM_RUN_DENIED: allowlist miss` → el comando no está en la lista de permitidos de exec.

      Páginas detalladas:

      - [/gateway/troubleshooting#node-paired-tool-fails](/es/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/es/nodes/troubleshooting)
      - [/tools/exec-approvals](/es/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec de repente pide aprobación">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Qué cambió:

      - Si `tools.exec.host` no está configurado, el valor predeterminado es `auto`.
      - `host=auto` se resuelve como `sandbox` cuando hay un runtime sandbox activo, y como `gateway` en caso contrario.
      - `host=auto` es solo enrutamiento; el comportamiento "YOLO" sin prompt proviene de `security=full` más `ask=off` en gateway/node.
      - En `gateway` y `node`, si `tools.exec.security` no está configurado, el valor predeterminado es `full`.
      - Si `tools.exec.ask` no está configurado, el valor predeterminado es `off`.
      - Resultado: si estás viendo aprobaciones, alguna política local del host o por sesión endureció exec con respecto a los valores predeterminados actuales.

      Restaura el comportamiento actual predeterminado sin aprobación:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Alternativas más seguras:

      - Configura solo `tools.exec.host=gateway` si solo quieres un enrutamiento estable al host.
      - Usa `security=allowlist` con `ask=on-miss` si quieres exec en el host pero aún quieres revisión cuando haya fallos de allowlist.
      - Habilita el modo sandbox si quieres que `host=auto` vuelva a resolverse como `sandbox`.

      Firmas comunes en logs:

      - `Approval required.` → el comando está esperando `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → la aprobación de exec en host node está pendiente.
      - `exec host=sandbox requires a sandbox runtime for this session` → selección implícita/explícita de sandbox, pero el modo sandbox está desactivado.

      Páginas detalladas:

      - [/tools/exec](/es/tools/exec)
      - [/tools/exec-approvals](/es/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/es/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="Falla la herramienta del navegador">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      La salida correcta se ve así:

      - El estado del navegador muestra `running: true` y un navegador/perfil seleccionado.
      - `openclaw` inicia, o `user` puede ver pestañas locales de Chrome.

      Firmas comunes en logs:

      - `unknown command "browser"` o `unknown command 'browser'` → `plugins.allow` está configurado y no incluye `browser`.
      - `Failed to start Chrome CDP on port` → falló el inicio local del navegador.
      - `browser.executablePath not found` → la ruta binaria configurada es incorrecta.
      - `browser.cdpUrl must be http(s) or ws(s)` → la URL de CDP configurada usa un esquema no compatible.
      - `browser.cdpUrl has invalid port` → la URL de CDP configurada tiene un puerto incorrecto o fuera de rango.
      - `No Chrome tabs found for profile="user"` → el perfil de adjunción Chrome MCP no tiene pestañas locales de Chrome abiertas.
      - `Remote CDP for profile "<name>" is not reachable` → el endpoint remoto de CDP configurado no es accesible desde este host.
      - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil de solo adjunción no tiene un destino CDP activo.
      - sobrescrituras persistentes de viewport / modo oscuro / configuración regional / sin conexión en perfiles attach-only o de CDP remoto → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación sin reiniciar el gateway.

      Páginas detalladas:

      - [/gateway/troubleshooting#browser-tool-fails](/es/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/es/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/es/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## Relacionado

- [FAQ](/es/help/faq) — preguntas frecuentes
- [Gateway Troubleshooting](/es/gateway/troubleshooting) — problemas específicos del gateway
- [Doctor](/es/gateway/doctor) — verificaciones automáticas de estado y reparaciones
- [Channel Troubleshooting](/es/channels/troubleshooting) — problemas de conectividad de canales
- [Automation Troubleshooting](/es/automation/cron-jobs#troubleshooting) — problemas de Cron y Heartbeat
