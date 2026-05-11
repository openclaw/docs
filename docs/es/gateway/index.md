---
read_when:
    - Ejecución o depuración del proceso del Gateway
summary: Guía operativa para el servicio Gateway, el ciclo de vida y las operaciones
title: Manual operativo de Gateway
x-i18n:
    generated_at: "2026-05-11T20:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Usa esta página para el arranque del día 1 y las operaciones del día 2 del servicio Gateway.

<CardGroup cols={2}>
  <Card title="Solución avanzada de problemas" icon="siren" href="/es/gateway/troubleshooting">
    Diagnósticos a partir de síntomas con secuencias exactas de comandos y firmas de registro.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Guía de configuración orientada a tareas + referencia completa de configuración.
  </Card>
  <Card title="Gestión de secretos" icon="key-round" href="/es/gateway/secrets">
    Contrato SecretRef, comportamiento de instantáneas en tiempo de ejecución y operaciones de migración/recarga.
  </Card>
  <Card title="Contrato del plan de secretos" icon="shield-check" href="/es/gateway/secrets-plan-contract">
    Reglas exactas de destino/ruta de `secrets apply` y comportamiento de perfiles de autenticación solo por referencia.
  </Card>
</CardGroup>

## Arranque local en 5 minutos

<Steps>
  <Step title="Iniciar el Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verificar el estado del servicio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Base saludable: `Runtime: running`, `Connectivity probe: ok` y `Capability: ...` que coincida con lo esperado. Usa `openclaw gateway status --require-rpc` cuando necesites prueba RPC de alcance de lectura, no solo accesibilidad.

  </Step>

  <Step title="Validar la preparación del canal">

```bash
openclaw channels status --probe
```

Con un gateway accesible, esto ejecuta sondeos de canal en vivo por cuenta y auditorías opcionales.
Si el gateway no es accesible, la CLI recurre a resúmenes de canales solo de configuración en lugar
de la salida de sondeos en vivo.

  </Step>
</Steps>

<Note>
La recarga de configuración del Gateway observa la ruta activa del archivo de configuración (resuelta a partir de los valores predeterminados de perfil/estado, o `OPENCLAW_CONFIG_PATH` cuando está definida).
El modo predeterminado es `gateway.reload.mode="hybrid"`.
Después de la primera carga correcta, el proceso en ejecución sirve la instantánea activa de configuración en memoria; una recarga correcta cambia esa instantánea de forma atómica.
</Note>

## Modelo de tiempo de ejecución

- Un proceso siempre activo para enrutamiento, plano de control y conexiones de canales.
- Un único puerto multiplexado para:
  - Control/RPC WebSocket
  - API HTTP, compatibles con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - IU de control y hooks
- Modo de enlace predeterminado: `loopback`.
- La autenticación es obligatoria de forma predeterminada. Las configuraciones con secreto compartido usan
  `gateway.auth.token` / `gateway.auth.password` (o
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), y las configuraciones de proxy inverso
  no loopback pueden usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatibles con OpenAI

La superficie de compatibilidad de mayor valor de OpenClaw ahora es:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por qué importa este conjunto:

- La mayoría de las integraciones de Open WebUI, LobeChat y LibreChat sondean primero `/v1/models`.
- Muchas canalizaciones de RAG y memoria esperan `/v1/embeddings`.
- Los clientes nativos de agentes prefieren cada vez más `/v1/responses`.

Nota de planificación:

- `/v1/models` está orientado primero a agentes: devuelve `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
- `openclaw/default` es el alias estable que siempre se asigna al agente predeterminado configurado.
- Usa `x-openclaw-model` cuando quieras sobrescribir el proveedor/modelo de backend; de lo contrario, el modelo normal del agente seleccionado y la configuración de embeddings siguen teniendo el control.

Todo esto se ejecuta en el puerto principal del Gateway y usa el mismo límite de autenticación de operador confiable que el resto de la API HTTP del Gateway.

### Precedencia de puerto y enlace

| Ajuste       | Orden de resolución                                          |
| ------------ | ------------------------------------------------------------- |
| Puerto del Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de enlace | CLI/sobrescritura → `gateway.bind` → `loopback`               |

Los servicios de gateway instalados registran el `--port` resuelto en los metadatos del supervisor. Después de cambiar `gateway.port`, ejecuta `openclaw doctor --fix` o `openclaw gateway install --force` para que launchd/systemd/schtasks inicie el proceso en el nuevo puerto.

El arranque del Gateway usa el mismo puerto y enlace efectivos cuando inicializa los orígenes locales
de la IU de control para enlaces no loopback. Por ejemplo, `--bind lan --port 3000`
inicializa `http://localhost:3000` y `http://127.0.0.1:3000` antes de que se ejecute
la validación en tiempo de ejecución. Agrega cualquier origen de navegador remoto, como URL de proxy HTTPS, a
`gateway.controlUi.allowedOrigins` explícitamente.

### Modos de recarga en caliente

| `gateway.reload.mode` | Comportamiento                            |
| --------------------- | ------------------------------------------ |
| `off`                 | Sin recarga de configuración               |
| `hot`                 | Aplica solo cambios seguros en caliente    |
| `restart`             | Reinicia ante cambios que requieren recarga |
| `hybrid` (predeterminado) | Aplica en caliente cuando es seguro, reinicia cuando es necesario |

## Conjunto de comandos del operador

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` es para descubrimiento adicional de servicios (LaunchDaemons/unidades systemd del sistema/schtasks), no para un sondeo de estado RPC más profundo.

## Múltiples gateways (mismo host)

La mayoría de las instalaciones deberían ejecutar un gateway por máquina. Un único gateway puede alojar varios
agentes y canales.

Solo necesitas varios gateways cuando quieres intencionalmente aislamiento o un bot de rescate.

Comprobaciones útiles:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Qué esperar:

- `gateway status --deep` puede informar `Other gateway-like services detected (best effort)`
  e imprimir sugerencias de limpieza cuando todavía existan instalaciones launchd/systemd/schtasks obsoletas.
- `gateway probe` puede advertir sobre `multiple reachable gateways` cuando responde más de un destino.
- Si eso es intencional, aísla puertos, configuración/estado y raíces de espacio de trabajo por gateway.

Lista de verificación por instancia:

- `gateway.port` único
- `OPENCLAW_CONFIG_PATH` único
- `OPENCLAW_STATE_DIR` único
- `agents.defaults.workspace` único

Ejemplo:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configuración detallada: [/gateway/multiple-gateways](/es/gateway/multiple-gateways).

## Acceso remoto

Preferido: Tailscale/VPN.
Alternativa: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Luego conecta los clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Los túneles SSH no eluden la autenticación del gateway. Para la autenticación con secreto compartido, los clientes aún
deben enviar `token`/`password` incluso a través del túnel. Para modos con identidad,
la solicitud aún tiene que satisfacer esa ruta de autenticación.
</Warning>

Consulta: [Gateway remoto](/es/gateway/remote), [Autenticación](/es/gateway/authentication), [Tailscale](/es/gateway/tailscale).

## Supervisión y ciclo de vida del servicio

Usa ejecuciones supervisadas para una fiabilidad similar a producción.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Usa `openclaw gateway restart` para reinicios. No encadenes `openclaw gateway stop` y `openclaw gateway start` como sustituto de reinicio.

En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada: esto elimina el LaunchAgent de la sesión de arranque actual sin persistir una deshabilitación, por lo que la recuperación automática de KeepAlive sigue funcionando tras bloqueos inesperados y `gateway start` vuelve a habilitarlo limpiamente. Para suprimir de forma persistente la reaparición automática entre reinicios, pasa `--disable`: `openclaw gateway stop --disable`.

Las etiquetas de LaunchAgent son `ai.openclaw.gateway` (predeterminada) o `ai.openclaw.<profile>` (perfil con nombre). `openclaw doctor` audita y repara desviaciones de configuración del servicio.

  </Tab>

  <Tab title="Linux (usuario systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistencia después de cerrar sesión, habilita lingering:

```bash
sudo loginctl enable-linger <user>
```

Ejemplo manual de unidad de usuario cuando necesitas una ruta de instalación personalizada:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (nativo)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

El arranque administrado nativo de Windows usa una tarea programada llamada `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` para perfiles con nombre). Si se deniega la creación de la tarea programada,
OpenClaw recurre a un iniciador por usuario en la carpeta de inicio
que apunta a `gateway.cmd` dentro del directorio de estado.

  </Tab>

  <Tab title="Linux (servicio del sistema)">

Usa una unidad del sistema para hosts multiusuario/siempre activos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa el mismo cuerpo de servicio que la unidad de usuario, pero instálalo en
`/etc/systemd/system/openclaw-gateway[-<profile>].service` y ajusta
`ExecStart=` si tu binario `openclaw` está en otro lugar.

No permitas también que `openclaw doctor --fix` instale un servicio de gateway de nivel de usuario para el mismo perfil/puerto. Doctor rechaza esa instalación automática cuando encuentra un servicio de Gateway OpenClaw de nivel de sistema; usa `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando la unidad del sistema es dueña del ciclo de vida.

  </Tab>
</Tabs>

## Ruta rápida del perfil de desarrollo

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Los valores predeterminados incluyen estado/configuración aislados y puerto base del gateway `19001`.

## Referencia rápida del protocolo (vista del operador)

- El primer frame de cliente debe ser `connect`.
- El Gateway devuelve la instantánea `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, límites/política).
- `hello-ok.features.methods` / `events` son una lista de descubrimiento conservadora, no
  un volcado generado de cada ruta auxiliar invocable.
- Solicitudes: `req(method, params)` → `res(ok/payload|error)`.
- Los eventos comunes incluyen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de emparejamiento/aprobación y `shutdown`.

Las ejecuciones de agentes son de dos etapas:

1. Acuse de aceptación inmediato (`status:"accepted"`)
2. Respuesta final de finalización (`status:"ok"|"error"`), con eventos `agent` transmitidos entre medias.

Consulta la documentación completa del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

## Comprobaciones operativas

### Actividad

- Abre WS y envía `connect`.
- Espera la respuesta `hello-ok` con instantánea.

### Preparación

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperación de brechas

Los eventos no se reproducen. En brechas de secuencia, actualiza el estado (`health`, `system-presence`) antes de continuar.

## Firmas de fallo comunes

| Firma                                                      | Problema probable                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Enlace no local sin una ruta de autenticación de Gateway válida                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflicto de puerto                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | Configuración establecida en modo remoto, o falta la marca de modo local en una configuración dañada |
| `unauthorized` during connect                                  | Incompatibilidad de autenticación entre el cliente y el Gateway                                        |

Para ver las escalas completas de diagnóstico, usa [Solución de problemas del Gateway](/es/gateway/troubleshooting).

## Garantías de seguridad

- Los clientes del protocolo Gateway fallan rápido cuando Gateway no está disponible (sin alternativa implícita directa al canal).
- Los primeros marcos inválidos o que no son de conexión se rechazan y se cierran.
- El apagado ordenado emite el evento `shutdown` antes de cerrar el socket.

---

Relacionado:

- [Solución de problemas](/es/gateway/troubleshooting)
- [Proceso en segundo plano](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Estado](/es/gateway/health)
- [Diagnóstico](/es/gateway/doctor)
- [Autenticación](/es/gateway/authentication)

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
- [Acceso remoto](/es/gateway/remote)
- [Gestión de secretos](/es/gateway/secrets)
