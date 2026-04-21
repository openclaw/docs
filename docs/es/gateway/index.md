---
read_when:
    - Ejecutar o depurar el proceso del Gateway
summary: Guía operativa del servicio Gateway, ciclo de vida y operaciones
title: Guía operativa del Gateway
x-i18n:
    generated_at: "2026-04-21T05:14:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Guía operativa del Gateway

Usa esta página para el arranque del primer día y las operaciones del segundo día del servicio Gateway.

<CardGroup cols={2}>
  <Card title="Solución profunda de problemas" icon="siren" href="/es/gateway/troubleshooting">
    Diagnósticos orientados por síntomas con secuencias exactas de comandos y firmas de logs.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Guía de configuración orientada a tareas + referencia completa de configuración.
  </Card>
  <Card title="Gestión de secretos" icon="key-round" href="/es/gateway/secrets">
    Contrato de SecretRef, comportamiento de instantáneas en tiempo de ejecución y operaciones de migración/recarga.
  </Card>
  <Card title="Contrato del plan de secretos" icon="shield-check" href="/es/gateway/secrets-plan-contract">
    Reglas exactas de objetivo/ruta de `secrets apply` y comportamiento de perfiles de autenticación solo por referencia.
  </Card>
</CardGroup>

## Arranque local en 5 minutos

<Steps>
  <Step title="Inicia el Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verifica el estado del servicio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Referencia saludable: `Runtime: running`, `Connectivity probe: ok` y `Capability: ...` que coincida con lo que esperas. Usa `openclaw gateway status --require-rpc` cuando necesites prueba de RPC con alcance de lectura, no solo accesibilidad.

  </Step>

  <Step title="Valida la preparación del canal">

```bash
openclaw channels status --probe
```

Con un gateway accesible, esto ejecuta probes en vivo por cuenta y auditorías opcionales.
Si el gateway no es accesible, la CLI vuelve a resúmenes de canales solo de configuración en lugar
de salida de probes en vivo.

  </Step>
</Steps>

<Note>
La recarga de configuración del Gateway observa la ruta activa del archivo de configuración (resuelta desde los valores predeterminados de perfil/estado, o `OPENCLAW_CONFIG_PATH` cuando está definido).
El modo predeterminado es `gateway.reload.mode="hybrid"`.
Después de la primera carga correcta, el proceso en ejecución sirve la instantánea activa de configuración en memoria; una recarga correcta intercambia esa instantánea de forma atómica.
</Note>

## Modelo de ejecución

- Un proceso siempre activo para enrutamiento, plano de control y conexiones de canales.
- Un único puerto multiplexado para:
  - Control/RPC por WebSocket
  - APIs HTTP, compatibles con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI de control y hooks
- Modo de bind predeterminado: `loopback`.
- La autenticación es obligatoria de forma predeterminada. Las configuraciones con secreto compartido usan
  `gateway.auth.token` / `gateway.auth.password` (o
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), y las configuraciones con proxy inverso fuera de loopback
  pueden usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatibles con OpenAI

La superficie de compatibilidad de mayor valor de OpenClaw ahora es:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por qué este conjunto es importante:

- La mayoría de las integraciones con Open WebUI, LobeChat y LibreChat consultan primero `/v1/models`.
- Muchos pipelines de RAG y memoria esperan `/v1/embeddings`.
- Los clientes nativos de agentes prefieren cada vez más `/v1/responses`.

Nota de planificación:

- `/v1/models` está orientado a agentes: devuelve `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
- `openclaw/default` es el alias estable que siempre apunta al agente predeterminado configurado.
- Usa `x-openclaw-model` cuando quieras un reemplazo de proveedor/modelo backend; de lo contrario, el modelo normal y la configuración de embeddings del agente seleccionado siguen teniendo el control.

Todo esto se ejecuta en el puerto principal del Gateway y usa el mismo límite de autenticación de operador de confianza que el resto de la API HTTP del Gateway.

### Precedencia de puerto y bind

| Configuración | Orden de resolución                                            |
| ------------- | -------------------------------------------------------------- |
| Puerto Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind  | CLI/override → `gateway.bind` → `loopback`                     |

### Modos de recarga en caliente

| `gateway.reload.mode` | Comportamiento                              |
| --------------------- | ------------------------------------------- |
| `off`                 | Sin recarga de configuración                |
| `hot`                 | Aplicar solo cambios seguros en caliente    |
| `restart`             | Reiniciar en cambios que requieren recarga  |
| `hybrid` (predeterminado) | Aplicar en caliente cuando sea seguro, reiniciar cuando sea necesario |

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

`gateway status --deep` es para descubrimiento adicional de servicios (LaunchDaemons/unidades systemd del sistema
/schtasks), no para un probe de estado RPC más profundo.

## Múltiples gateways (mismo host)

La mayoría de las instalaciones deberían ejecutar un gateway por máquina. Un solo gateway puede alojar múltiples
agentes y canales.

Solo necesitas múltiples gateways cuando quieres aislamiento intencional o un bot de rescate.

Comprobaciones útiles:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Qué esperar:

- `gateway status --deep` puede informar `Other gateway-like services detected (best effort)`
  e imprimir sugerencias de limpieza cuando aún existen instalaciones obsoletas de launchd/systemd/schtasks.
- `gateway probe` puede advertir sobre `multiple reachable gateways` cuando responde más de un
  objetivo.
- Si eso es intencional, aísla puertos, config/estado y raíces de workspace por gateway.

Configuración detallada: [/gateway/multiple-gateways](/es/gateway/multiple-gateways).

## Acceso remoto

Preferido: Tailscale/VPN.
Respaldo: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Luego conecta los clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Los túneles SSH no omiten la autenticación del gateway. Para autenticación con secreto compartido, los clientes aún
deben enviar `token`/`password` incluso sobre el túnel. Para los modos con identidad,
la solicitud igualmente debe satisfacer esa ruta de autenticación.
</Warning>

Consulta: [Gateway remoto](/es/gateway/remote), [Autenticación](/es/gateway/authentication), [Tailscale](/es/gateway/tailscale).

## Supervisión y ciclo de vida del servicio

Usa ejecuciones supervisadas para una fiabilidad de nivel producción.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Las etiquetas LaunchAgent son `ai.openclaw.gateway` (predeterminado) o `ai.openclaw.<profile>` (perfil con nombre). `openclaw doctor` audita y repara la deriva de configuración del servicio.

  </Tab>

  <Tab title="Linux (systemd de usuario)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistencia después de cerrar sesión, activa lingering:

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
OpenClaw vuelve a un lanzador por usuario en la carpeta de Inicio que apunta a `gateway.cmd` dentro del directorio de estado.

  </Tab>

  <Tab title="Linux (servicio del sistema)">

Usa una unidad del sistema para hosts multiusuario/siempre activos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa el mismo cuerpo de servicio que la unidad de usuario, pero instálalo en
`/etc/systemd/system/openclaw-gateway[-<profile>].service` y ajusta
`ExecStart=` si tu binario `openclaw` vive en otra ubicación.

  </Tab>
</Tabs>

## Múltiples gateways en un host

La mayoría de las configuraciones deberían ejecutar **un** Gateway.
Usa varios solo para aislamiento/redundancia estrictos (por ejemplo, un perfil de rescate).

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

Consulta: [Múltiples gateways](/es/gateway/multiple-gateways).

### Ruta rápida de perfil de desarrollo

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Los valores predeterminados incluyen estado/config aislados y puerto base del gateway `19001`.

## Referencia rápida del protocolo (vista del operador)

- El primer frame del cliente debe ser `connect`.
- El Gateway devuelve una instantánea `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, límites/política).
- `hello-ok.features.methods` / `events` son una lista conservadora de descubrimiento, no
  un volcado generado de cada ruta auxiliar invocable.
- Solicitudes: `req(method, params)` → `res(ok/payload|error)`.
- Los eventos comunes incluyen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos del ciclo de vida de emparejamiento/aprobación y `shutdown`.

Las ejecuciones del agente son de dos etapas:

1. Ack inmediato de aceptación (`status:"accepted"`)
2. Respuesta final de finalización (`status:"ok"|"error"`), con eventos `agent` transmitidos entre ambas.

Consulta la documentación completa del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

## Comprobaciones operativas

### Actividad

- Abre WS y envía `connect`.
- Espera una respuesta `hello-ok` con instantánea.

### Preparación

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperación de huecos

Los eventos no se reproducen. En huecos de secuencia, actualiza el estado (`health`, `system-presence`) antes de continuar.

## Firmas comunes de fallos

| Firma                                                         | Problema probable                                                                |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind fuera de loopback sin una ruta válida de autenticación del gateway         |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflicto de puerto                                                             |
| `Gateway start blocked: set gateway.mode=local`               | Configurada en modo remoto, o falta el sello de modo local en una configuración dañada |
| `unauthorized` during connect                                 | Desajuste de autenticación entre cliente y gateway                              |

Para secuencias completas de diagnóstico, usa [Solución de problemas del Gateway](/es/gateway/troubleshooting).

## Garantías de seguridad

- Los clientes del protocolo Gateway fallan rápido cuando el Gateway no está disponible (sin fallback implícito a canal directo).
- Los primeros frames no válidos/no `connect` se rechazan y se cierran.
- El apagado ordenado emite el evento `shutdown` antes del cierre del socket.

---

Relacionado:

- [Solución de problemas](/es/gateway/troubleshooting)
- [Proceso en segundo plano](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Estado](/es/gateway/health)
- [Doctor](/es/gateway/doctor)
- [Autenticación](/es/gateway/authentication)
