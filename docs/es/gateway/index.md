---
read_when:
    - Ejecutar o depurar el proceso de Gateway
summary: Manual operativo del servicio Gateway, ciclo de vida y operaciones
title: Manual de operaciones del Gateway
x-i18n:
    generated_at: "2026-07-06T10:50:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 177748e282b8ac75070a38ec91f5503ae53076f524255f0dc8d06880d946e0de
    source_path: gateway/index.md
    workflow: 16
---

Usa esta página para el arranque del día 1 y las operaciones del día 2 del servicio Gateway.

<CardGroup cols={2}>
  <Card title="Solución de problemas avanzada" icon="siren" href="/es/gateway/troubleshooting">
    Diagnósticos basados en síntomas con secuencias exactas de comandos y firmas de logs.
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

Base saludable: `Runtime: running`, `Connectivity probe: ok` y una línea `Capability` que coincida con lo que esperas. Usa `openclaw gateway status --require-rpc` para una prueba RPC con alcance de lectura, no solo de accesibilidad.

  </Step>

  <Step title="Valida la preparación del canal">

```bash
openclaw channels status --probe
```

Con un gateway accesible, esto ejecuta sondeos de canal en vivo por cuenta y auditorías opcionales. Si el gateway no es accesible, la CLI recurre a resúmenes de canales basados solo en la configuración.

  </Step>
</Steps>

<Note>
La recarga de configuración del Gateway observa la ruta activa del archivo de configuración (resuelta desde los valores predeterminados de perfil/estado, o desde `OPENCLAW_CONFIG_PATH` cuando está definido). El modo predeterminado es `gateway.reload.mode="hybrid"`. Después de la primera carga correcta, el proceso en ejecución sirve la instantánea activa de configuración en memoria; una recarga correcta sustituye esa instantánea de forma atómica.
</Note>

## Modelo de tiempo de ejecución

- Un proceso siempre activo para enrutamiento, plano de control y conexiones de canales.
- Un único puerto multiplexado para:
  - Control/RPC por WebSocket
  - API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Rutas HTTP de Plugin, como la opcional `/api/v1/admin/rpc`
  - Control UI y hooks
- Modo de enlace predeterminado: `loopback`. Dentro de un entorno de contenedor detectado, el valor predeterminado efectivo es `auto` (se resuelve a `0.0.0.0` para reenvío de puertos), salvo que Tailscale serve/funnel esté activo, lo que siempre fuerza `loopback`.
- La autenticación es obligatoria de forma predeterminada. Las configuraciones con secreto compartido usan `gateway.auth.token` / `gateway.auth.password` (o `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), y las configuraciones con proxy inverso que no sean loopback pueden usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatibles con OpenAI

La superficie de compatibilidad de mayor impacto de OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por qué importa este conjunto:

- La mayoría de las integraciones de Open WebUI, LobeChat y LibreChat sondean primero `/v1/models`.
- Muchas canalizaciones de RAG y memoria esperan `/v1/embeddings`.
- Los clientes nativos de agentes prefieren cada vez más `/v1/responses`.

`/v1/models` está orientado a agentes: devuelve `openclaw`, `openclaw/default` y `openclaw/<agentId>` para cada agente configurado. `openclaw/default` es el alias estable que siempre se asigna al agente predeterminado configurado. Envía `x-openclaw-model` cuando quieras anular el proveedor/modelo de backend; de lo contrario, la configuración normal de modelo y embeddings del agente seleccionado mantiene el control.

Todos estos se ejecutan en el puerto principal del Gateway y usan el mismo límite de autenticación de operador de confianza que el resto de la API HTTP del Gateway.

El RPC HTTP de administración (`POST /api/v1/admin/rpc`) es una ruta de Plugin separada, desactivada de forma predeterminada, para herramientas del host que no pueden usar RPC por WebSocket. Consulta [RPC HTTP de administración](/es/plugins/admin-http-rpc).

### Precedencia de puerto y enlace

| Configuración | Orden de resolución                                                   |
| ------------ | -------------------------------------------------------------------- |
| Puerto del Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Modo de enlace | CLI/anulación → `gateway.bind` → `loopback` (o `auto` en contenedores) |

Los servicios de gateway instalados registran el `--port` resuelto en los metadatos del supervisor. Después de cambiar `gateway.port`, ejecuta `openclaw doctor --fix` o `openclaw gateway install --force` para que launchd/systemd/schtasks inicie el proceso en el puerto nuevo.

El arranque del Gateway usa el mismo puerto y enlace efectivos cuando siembra orígenes locales de Control UI para enlaces que no son loopback. Por ejemplo, `--bind lan --port 3000` siembra `http://localhost:3000` y `http://127.0.0.1:3000` antes de que se ejecute la validación en tiempo de ejecución. Añade explícitamente cualquier origen de navegador remoto, como URL de proxy HTTPS, a `gateway.controlUi.allowedOrigins`.

### Modos de recarga en caliente

| `gateway.reload.mode` | Comportamiento                            |
| --------------------- | ------------------------------------------ |
| `off`                 | Sin recarga de configuración               |
| `hot`                 | Aplica solo cambios seguros en caliente    |
| `restart`             | Reinicia ante cambios que requieren recarga |
| `hybrid` (predeterminado) | Aplica en caliente cuando es seguro, reinicia cuando es necesario |

## Conjunto de comandos de operador

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

`gateway status --deep` sirve para descubrimiento adicional de servicios (LaunchDaemons/unidades systemd del sistema/schtasks), no para un sondeo de salud RPC más profundo.

## Múltiples gateways (mismo host)

La mayoría de las instalaciones deberían ejecutar un gateway por máquina. Un único gateway puede alojar varios agentes y canales. Solo necesitas varios gateways cuando quieres intencionadamente aislamiento o un bot de rescate.

Comprobaciones útiles:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Qué esperar:

- `gateway status --deep` puede informar `Other gateway-like services detected (best effort)` e imprimir pistas de limpieza cuando aún quedan instalaciones obsoletas de launchd/systemd/schtasks.
- `gateway probe` puede advertir sobre `multiple reachable gateway identities` cuando responden gateways distintos, o cuando OpenClaw no puede demostrar que los destinos accesibles son el mismo gateway. Un túnel SSH, una URL de proxy o una URL remota configurada hacia el mismo gateway es un gateway con varios transportes, incluso cuando los puertos de transporte difieren.
- Si eso es intencional, aísla puertos, configuración/estado y raíces de espacios de trabajo por gateway.

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
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Luego conecta los clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Los túneles SSH no omiten la autenticación del gateway. Para autenticación con secreto compartido, los clientes aún
deben enviar `token`/`password` incluso a través del túnel. Para modos con identidad,
la solicitud aún debe satisfacer esa ruta de autenticación.
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

En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada. Esto elimina el LaunchAgent de la sesión de arranque actual sin persistir una desactivación, por lo que la recuperación automática de KeepAlive sigue funcionando después de cierres inesperados y `gateway start` vuelve a habilitarlo correctamente. Para suprimir de forma persistente el reinicio automático entre reinicios del sistema, pasa `--disable`: `openclaw gateway stop --disable`.

Las etiquetas de LaunchAgent son `ai.openclaw.gateway` (predeterminado) o `ai.openclaw.<profile>` (perfil con nombre). `openclaw doctor` audita y repara desviaciones de configuración del servicio.

  </Tab>

  <Tab title="Linux (usuario systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistencia después de cerrar sesión, habilita lingering:

```bash
sudo loginctl enable-linger $(whoami)
```

En un servidor sin interfaz gráfica y sin sesión de escritorio, asegúrate también de que `XDG_RUNTIME_DIR` esté definido (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) antes de reintentar comandos `systemctl --user`.

Ejemplo de unidad de usuario manual cuando necesitas una ruta de instalación personalizada:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
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

El arranque gestionado nativo de Windows usa una tarea programada llamada `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` para perfiles con nombre). Si se deniega la
creación de la tarea programada, OpenClaw recurre a un iniciador en la carpeta
de inicio por usuario que apunta a `gateway.cmd` dentro del directorio de estado.

  </Tab>

  <Tab title="Linux (servicio del sistema)">

Usa una unidad de sistema para hosts multiusuario/siempre activos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa el mismo cuerpo de servicio que la unidad de usuario, pero instálalo en
`/etc/systemd/system/openclaw-gateway[-<profile>].service` y ajusta
`ExecStart=` si tu binario `openclaw` está en otra ubicación.

No permitas también que `openclaw doctor --fix` instale un servicio de gateway de nivel de usuario para el mismo perfil/puerto. Doctor rechaza esa instalación automática cuando encuentra un servicio de gateway OpenClaw de nivel de sistema; usa `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando la unidad de sistema sea la propietaria del ciclo de vida.

  </Tab>
</Tabs>

Los errores de configuración no válida salen con el código `78`. Las unidades systemd de Linux usan `RestartPreventExitStatus=78` para dejar de reiniciar hasta que se corrija la configuración. launchd y el Programador de tareas de Windows no tienen una regla equivalente de detención por código de salida, por lo que el Gateway también persiste el historial de arranques rápidos no limpios y suprime el inicio automático de cuentas de canal/proveedor después de fallos de arranque repetidos. En ese modo seguro, el plano de control sigue arrancando para inspección y reparación, las recargas en caliente de configuración y `secrets.reload` rechazan reinicios automáticos de canales, y una solicitud explícita de operador `channels.start` puede anular la supresión.

## Ruta rápida de perfil de desarrollo

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Los valores predeterminados incluyen estado/configuración aislados y el puerto base de gateway `19001`.

## Referencia rápida del protocolo (vista de operador)

- El primer frame del cliente debe ser `connect`.
- Gateway devuelve un frame `hello-ok` con un `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) más límites de `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` son una lista de descubrimiento conservadora, no
  un volcado generado de todas las rutas auxiliares invocables.
- Solicitudes: `req(method, params)` → `res(ok/payload|error)`.
- Los eventos comunes incluyen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, eventos del ciclo de vida de emparejamiento/aprobación,
  y `shutdown`.

Las ejecuciones de agente tienen dos etapas:

1. Acuse inmediato aceptado (`status:"accepted"`)
2. Respuesta final de finalización (`status:"ok"|"error"`), con eventos `agent` transmitidos entre medias.

Consulta la documentación completa del protocolo: [Protocolo de Gateway](/es/gateway/protocol).

## Comprobaciones operativas

### Actividad

- Abre WS y envía `connect`.
- Espera una respuesta `hello-ok` con snapshot.

### Preparación

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperación de brechas

Los eventos no se reproducen. En brechas de secuencia, actualiza el estado (`health`, `system-presence`) antes de continuar.

## Firmas de fallo comunes

| Firma                                                         | Problema probable                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Enlace no local loopback sin una ruta de autenticación de gateway válida        |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflicto de puerto                                                             |
| `Gateway start blocked: set gateway.mode=local`               | Configuración establecida en modo remoto, o falta `gateway.mode` en una configuración dañada |
| `unauthorized` durante la conexión                            | Incompatibilidad de autenticación entre el cliente y Gateway                    |

Para ver escaleras completas de diagnóstico, usa [Solución de problemas de Gateway](/es/gateway/troubleshooting).

## Garantías de seguridad

- Los clientes del protocolo Gateway fallan rápido cuando Gateway no está disponible (sin fallback implícito a canal directo).
- Los primeros frames no válidos o que no sean de conexión se rechazan y se cierran.
- El apagado ordenado emite el evento `shutdown` antes de cerrar el socket.

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
- [Proceso en segundo plano](/es/gateway/background-process)
- [Salud](/es/gateway/health)
- [Doctor](/es/gateway/doctor)
- [Autenticación](/es/gateway/authentication)
- [Acceso remoto](/es/gateway/remote)
- [Gestión de secretos](/es/gateway/secrets)
