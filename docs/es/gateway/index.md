---
read_when:
    - Ejecutar o depurar el proceso del Gateway
summary: Guía operativa del servicio Gateway, su ciclo de vida y operaciones
title: Guía operativa del Gateway
x-i18n:
    generated_at: "2026-04-24T05:29:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Usa esta página para las operaciones del día 1 de arranque y del día 2 del servicio Gateway.

<CardGroup cols={2}>
  <Card title="Solución de problemas en profundidad" icon="siren" href="/es/gateway/troubleshooting">
    Diagnósticos orientados por síntomas con secuencias exactas de comandos y firmas de registro.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Guía de configuración orientada a tareas + referencia completa de configuración.
  </Card>
  <Card title="Gestión de secretos" icon="key-round" href="/es/gateway/secrets">
    Contrato de SecretRef, comportamiento de instantáneas en runtime y operaciones de migración/recarga.
  </Card>
  <Card title="Contrato del plan de secretos" icon="shield-check" href="/es/gateway/secrets-plan-contract">
    Reglas exactas de objetivo/ruta de `secrets apply` y comportamiento de perfiles de autenticación solo con refs.
  </Card>
</CardGroup>

## Arranque local en 5 minutos

<Steps>
  <Step title="Inicia el Gateway">

```bash
openclaw gateway --port 18789
# depuración/traza reflejada en stdio
openclaw gateway --port 18789 --verbose
# fuerza la terminación del listener en el puerto seleccionado y luego inicia
openclaw gateway --force
```

  </Step>

  <Step title="Verifica el estado del servicio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Base saludable: `Runtime: running`, `Connectivity probe: ok` y `Capability: ...` que coincida con lo que esperas. Usa `openclaw gateway status --require-rpc` cuando necesites prueba RPC de alcance de lectura, no solo accesibilidad.

  </Step>

  <Step title="Valida la preparación de los canales">

```bash
openclaw channels status --probe
```

Con un gateway accesible esto ejecuta sondeos activos por cuenta y auditorías opcionales por canal.
Si el gateway no es accesible, la CLI recurre a resúmenes de canales basados solo en configuración en lugar
de salida de sondeo en vivo.

  </Step>
</Steps>

<Note>
La recarga de configuración del Gateway observa la ruta activa del archivo de configuración (resuelta desde los valores predeterminados de perfil/estado, o `OPENCLAW_CONFIG_PATH` cuando está configurado).
El modo predeterminado es `gateway.reload.mode="hybrid"`.
Después de la primera carga correcta, el proceso en ejecución sirve la instantánea activa de configuración en memoria; una recarga correcta intercambia esa instantánea de forma atómica.
</Note>

## Modelo de runtime

- Un proceso siempre activo para enrutamiento, plano de control y conexiones de canales.
- Un único puerto multiplexado para:
  - Control/RPC por WebSocket
  - API HTTP, compatible con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI de control y hooks
- Modo de bind predeterminado: `loopback`.
- La autenticación es obligatoria de forma predeterminada. Las configuraciones con secreto compartido usan
  `gateway.auth.token` / `gateway.auth.password` (o
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), y las configuraciones
  de proxy inverso sin loopback pueden usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatibles con OpenAI

La superficie de compatibilidad de mayor impacto de OpenClaw ahora es:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por qué este conjunto importa:

- La mayoría de integraciones con Open WebUI, LobeChat y LibreChat prueban primero `/v1/models`.
- Muchos pipelines de RAG y memory esperan `/v1/embeddings`.
- Los clientes nativos de agentes prefieren cada vez más `/v1/responses`.

Nota de planificación:

- `/v1/models` está orientado a agentes: devuelve `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
- `openclaw/default` es el alias estable que siempre se asigna al agente predeterminado configurado.
- Usa `x-openclaw-model` cuando quieras una sobrescritura de proveedor/modelo de backend; en caso contrario, el modelo normal y la configuración de embeddings del agente seleccionado siguen siendo quienes mandan.

Todos ellos se ejecutan en el puerto principal del Gateway y usan el mismo límite de autenticación de operador de confianza que el resto de la API HTTP del Gateway.

### Precedencia de puerto y bind

| Configuración | Orden de resolución                                             |
| ------------- | --------------------------------------------------------------- |
| Puerto del Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind  | CLI/sobrescritura → `gateway.bind` → `loopback`                 |

### Modos de recarga en caliente

| `gateway.reload.mode` | Comportamiento                              |
| --------------------- | ------------------------------------------- |
| `off`                 | Sin recarga de configuración                |
| `hot`                 | Aplicar solo cambios seguros para hot reload |
| `restart`             | Reiniciar en cambios que requieran recarga  |
| `hybrid` (predeterminado) | Aplicar en caliente cuando es seguro, reiniciar cuando sea necesario |

## Conjunto de comandos del operador

```bash
openclaw gateway status
openclaw gateway status --deep   # añade un escaneo del servicio a nivel de sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` sirve para descubrimiento adicional de servicios (LaunchDaemons/unidades systemd del sistema/schtasks), no para una sonda RPC de estado más profunda.

## Múltiples gateways (mismo host)

La mayoría de instalaciones deberían ejecutar un gateway por máquina. Un solo gateway puede alojar múltiples
agentes y canales.

Solo necesitas múltiples gateways cuando intencionadamente quieres aislamiento o un bot de rescate.

Comprobaciones útiles:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Qué esperar:

- `gateway status --deep` puede informar `Other gateway-like services detected (best effort)`
  y mostrar sugerencias de limpieza cuando aún quedan instalaciones antiguas de launchd/systemd/schtasks.
- `gateway probe` puede advertir `multiple reachable gateways` cuando responde más de un destino.
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

Después conecta los clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Los túneles SSH no omiten la autenticación del gateway. En autenticación con secreto compartido, los clientes siguen
teniendo que enviar `token`/`password` incluso a través del túnel. En modos con identidad,
la solicitud sigue teniendo que satisfacer esa ruta de autenticación.
</Warning>

Consulta: [Gateway remoto](/es/gateway/remote), [Autenticación](/es/gateway/authentication), [Tailscale](/es/gateway/tailscale).

## Supervisión y ciclo de vida del servicio

Usa ejecuciones supervisadas para una fiabilidad similar a la de producción.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Las etiquetas de LaunchAgent son `ai.openclaw.gateway` (predeterminado) o `ai.openclaw.<profile>` (perfil con nombre). `openclaw doctor` audita y repara desviaciones en la configuración del servicio.

  </Tab>

  <Tab title="Linux (systemd de usuario)">

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

El inicio administrado de Windows nativo usa una Scheduled Task llamada `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` para perfiles con nombre). Si se deniega la creación de la Scheduled Task,
OpenClaw recurre a un iniciador por usuario en la carpeta Inicio que apunta a `gateway.cmd` dentro del directorio de estado.

  </Tab>

  <Tab title="Linux (servicio del sistema)">

Usa una unidad del sistema para hosts multiusuario o siempre activos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa el mismo cuerpo de servicio que la unidad de usuario, pero instálalo bajo
`/etc/systemd/system/openclaw-gateway[-<profile>].service` y ajusta
`ExecStart=` si tu binario `openclaw` vive en otro lugar.

  </Tab>
</Tabs>

## Ruta rápida de perfil de desarrollo

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Los valores predeterminados incluyen estado/configuración aislados y puerto base de gateway `19001`.

## Referencia rápida del protocolo (vista de operador)

- El primer frame del cliente debe ser `connect`.
- El Gateway devuelve una instantánea `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, límites/política).
- `hello-ok.features.methods` / `events` son una lista conservadora de descubrimiento, no
  un volcado generado de cada ruta auxiliar invocable.
- Solicitudes: `req(method, params)` → `res(ok/payload|error)`.
- Los eventos comunes incluyen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos del ciclo de vida de Pairing/aprobación y `shutdown`.

Las ejecuciones de agentes tienen dos etapas:

1. Ack inmediato de aceptación (`status:"accepted"`)
2. Respuesta final de finalización (`status:"ok"|"error"`), con eventos `agent` transmitidos entre medias.

Consulta la documentación completa del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

## Comprobaciones operativas

### Actividad

- Abre un WS y envía `connect`.
- Espera una respuesta `hello-ok` con una instantánea.

### Preparación

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperación ante huecos

Los eventos no se reproducen. Si hay huecos en la secuencia, actualiza el estado (`health`, `system-presence`) antes de continuar.

## Firmas comunes de fallo

| Firma                                                         | Problema probable                                                                |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind sin loopback sin una ruta válida de autenticación del gateway               |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflicto de puerto                                                              |
| `Gateway start blocked: set gateway.mode=local`               | Configuración en modo remoto, o falta la marca de modo local en una configuración dañada |
| `unauthorized` during connect                                 | Incompatibilidad de autenticación entre cliente y gateway                        |

Para secuencias completas de diagnóstico, usa [Solución de problemas del Gateway](/es/gateway/troubleshooting).

## Garantías de seguridad

- Los clientes del protocolo del Gateway fallan rápidamente cuando el Gateway no está disponible (sin respaldo implícito directo a canal).
- Los primeros frames inválidos o que no sean `connect` se rechazan y se cierra la conexión.
- El apagado ordenado emite el evento `shutdown` antes del cierre del socket.

---

Relacionado:

- [Solución de problemas](/es/gateway/troubleshooting)
- [Proceso en segundo plano](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Estado](/es/gateway/health)
- [Doctor](/es/gateway/doctor)
- [Autenticación](/es/gateway/authentication)

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
- [Acceso remoto](/es/gateway/remote)
- [Gestión de secretos](/es/gateway/secrets)
