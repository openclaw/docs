---
read_when:
    - Ejecutar o depurar el proceso Gateway
summary: Guía operativa para el servicio Gateway, su ciclo de vida y sus operaciones
title: Guía operativa del Gateway
x-i18n:
    generated_at: "2026-04-26T11:28:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Usa esta página para el arranque del día 1 y las operaciones del día 2 del servicio Gateway.

<CardGroup cols={2}>
  <Card title="Solución profunda de problemas" icon="siren" href="/es/gateway/troubleshooting">
    Diagnósticos orientados por síntomas con secuencias exactas de comandos y firmas de logs.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Guía de configuración orientada a tareas + referencia completa de configuración.
  </Card>
  <Card title="Gestión de secretos" icon="key-round" href="/es/gateway/secrets">
    Contrato de SecretRef, comportamiento de instantáneas en runtime y operaciones de migración/recarga.
  </Card>
  <Card title="Contrato del plan de secretos" icon="shield-check" href="/es/gateway/secrets-plan-contract">
    Reglas exactas de destino/ruta de `secrets apply` y comportamiento de perfiles de autenticación solo con referencias.
  </Card>
</CardGroup>

## Arranque local en 5 minutos

<Steps>
  <Step title="Inicia el Gateway">

```bash
openclaw gateway --port 18789
# debug/trace reflejado en stdio
openclaw gateway --port 18789 --verbose
# mata por la fuerza el listener en el puerto seleccionado y luego inicia
openclaw gateway --force
```

  </Step>

  <Step title="Verifica el estado del servicio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Línea base saludable: `Runtime: running`, `Connectivity probe: ok` y `Capability: ...` que coincida con lo que esperas. Usa `openclaw gateway status --require-rpc` cuando necesites una prueba RPC con alcance de lectura, no solo accesibilidad.

  </Step>

  <Step title="Valida la preparación de los canales">

```bash
openclaw channels status --probe
```

Con un Gateway accesible, esto ejecuta sondas en vivo por cuenta y auditorías opcionales.
Si el Gateway no es accesible, la CLI recurre a resúmenes de canales solo de configuración en
lugar de la salida de sondas en vivo.

  </Step>
</Steps>

<Note>
La recarga de configuración del Gateway observa la ruta activa del archivo de configuración (resuelta a partir de los valores predeterminados de perfil/estado, o `OPENCLAW_CONFIG_PATH` cuando está establecido).
El modo predeterminado es `gateway.reload.mode="hybrid"`.
Después de la primera carga correcta, el proceso en ejecución sirve la instantánea activa de configuración en memoria; una recarga correcta intercambia esa instantánea de forma atómica.
</Note>

## Modelo de runtime

- Un proceso siempre activo para enrutamiento, plano de control y conexiones de canales.
- Un único puerto multiplexado para:
  - control/RPC por WebSocket
  - APIs HTTP, compatibles con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI y hooks
- Modo de enlace predeterminado: `loopback`.
- La autenticación es obligatoria por defecto. Las configuraciones con secreto compartido usan
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

Por qué importa este conjunto:

- La mayoría de las integraciones de Open WebUI, LobeChat y LibreChat sondean primero `/v1/models`.
- Muchas canalizaciones de RAG y memoria esperan `/v1/embeddings`.
- Los clientes nativos de agentes prefieren cada vez más `/v1/responses`.

Nota de planificación:

- `/v1/models` está orientado a agente primero: devuelve `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
- `openclaw/default` es el alias estable que siempre se asigna al agente predeterminado configurado.
- Usa `x-openclaw-model` cuando quieras una sustitución de proveedor/modelo del backend; en caso contrario, el modelo normal y la configuración de embeddings del agente seleccionado siguen teniendo el control.

Todos estos se ejecutan en el puerto principal del Gateway y usan el mismo límite de autenticación de operador de confianza que el resto de la API HTTP del Gateway.

### Precedencia de puerto y enlace

| Configuración   | Orden de resolución                                            |
| --------------- | -------------------------------------------------------------- |
| Puerto Gateway  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de enlace  | CLI/override → `gateway.bind` → `loopback`                    |

El arranque del Gateway usa el mismo puerto y enlace efectivos cuando inicializa
los orígenes locales de Control UI para enlaces que no son loopback. Por ejemplo, `--bind lan --port 3000`
inicializa `http://localhost:3000` y `http://127.0.0.1:3000` antes de que se ejecute la
validación de runtime. Añade explícitamente cualquier origen remoto de navegador, como URLs HTTPS de proxy, a
`gateway.controlUi.allowedOrigins`.

### Modos de recarga en caliente

| `gateway.reload.mode` | Comportamiento                           |
| --------------------- | ---------------------------------------- |
| `off`                 | Sin recarga de configuración             |
| `hot`                 | Aplicar solo cambios seguros en caliente |
| `restart`             | Reiniciar con cambios que requieren recarga |
| `hybrid` (predeterminado) | Aplicar en caliente cuando sea seguro, reiniciar cuando sea necesario |

## Conjunto de comandos del operador

```bash
openclaw gateway status
openclaw gateway status --deep   # añade un análisis de servicio a nivel del sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` es para descubrimiento adicional de servicios (LaunchDaemons/unidades systemd del sistema/
schtasks), no para una sonda de estado RPC más profunda.

## Varios gateways (mismo host)

La mayoría de las instalaciones deberían ejecutar un gateway por máquina. Un único gateway puede alojar varios
agentes y canales.

Solo necesitas varios gateways cuando intencionadamente quieres aislamiento o un bot de rescate.

Comprobaciones útiles:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Qué esperar:

- `gateway status --deep` puede informar `Other gateway-like services detected (best effort)`
  e imprimir sugerencias de limpieza cuando todavía existan instalaciones obsoletas de launchd/systemd/schtasks.
- `gateway probe` puede advertir sobre `multiple reachable gateways` cuando responde más de un destino.
- Si eso es intencional, aísla puertos, configuración/estado y raíces de workspace por gateway.

Lista de comprobación por instancia:

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

## Endpoint de cerebro en tiempo real de VoiceClaw

OpenClaw expone un endpoint WebSocket en tiempo real compatible con VoiceClaw en
`/voiceclaw/realtime`. Úsalo cuando un cliente de escritorio VoiceClaw deba hablar
directamente con un cerebro OpenClaw en tiempo real en lugar de pasar por un proceso
de relay separado.

El endpoint usa Gemini Live para audio en tiempo real y llama a OpenClaw como
cerebro exponiendo herramientas de OpenClaw directamente a Gemini Live. Las llamadas a herramientas devuelven un
resultado inmediato `working` para mantener ágil el turno de voz, y luego OpenClaw
ejecuta la herramienta real de forma asíncrona e inyecta el resultado de vuelta en la
sesión en vivo. Establece `GEMINI_API_KEY` en el entorno del proceso del gateway. Si la
autenticación del gateway está habilitada, el cliente de escritorio envía el token o la contraseña
del gateway en su primer mensaje `session.config`.

El acceso al cerebro en tiempo real ejecuta comandos de agente OpenClaw autorizados por el propietario. Mantén
`gateway.auth.mode: "none"` limitado a instancias de prueba solo con loopback. Las conexiones no locales
al cerebro en tiempo real requieren autenticación del gateway.

Para un gateway de prueba aislado, ejecuta una instancia separada con su propio puerto, configuración
y estado:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Luego configura VoiceClaw para usar:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Acceso remoto

Preferido: Tailscale/VPN.
Alternativa: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Luego conecta los clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Los túneles SSH no omiten la autenticación del gateway. Para autenticación con secreto compartido, los clientes aún
deben enviar `token`/`password` incluso a través del túnel. Para modos con identidad,
la solicitud aún tiene que satisfacer esa ruta de autenticación.
</Warning>

Consulta: [Gateway remoto](/es/gateway/remote), [Autenticación](/es/gateway/authentication), [Tailscale](/es/gateway/tailscale).

## Supervisión y ciclo de vida del servicio

Usa ejecuciones supervisadas para una fiabilidad de tipo producción.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Usa `openclaw gateway restart` para reinicios. No encadenes `openclaw gateway stop` y `openclaw gateway start`; en macOS, `gateway stop` deshabilita intencionadamente el LaunchAgent antes de detenerlo.

Las etiquetas de LaunchAgent son `ai.openclaw.gateway` (predeterminada) o `ai.openclaw.<profile>` (perfil con nombre). `openclaw doctor` audita y repara la deriva de configuración del servicio.

  </Tab>

  <Tab title="Linux (systemd de usuario)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistencia después del cierre de sesión, habilita lingering:

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
OpenClaw recurre a un iniciador por usuario en la carpeta Inicio que apunta a `gateway.cmd` dentro del directorio de estado.

  </Tab>

  <Tab title="Linux (servicio del sistema)">

Usa una unidad del sistema para hosts multiusuario/siempre activos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa el mismo cuerpo de servicio que la unidad de usuario, pero instálalo en
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

## Referencia rápida del protocolo (vista del operador)

- El primer frame del cliente debe ser `connect`.
- El Gateway devuelve una instantánea `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, límites/política).
- `hello-ok.features.methods` / `events` son una lista de descubrimiento conservadora, no
  un volcado generado de cada ruta auxiliar invocable.
- Solicitudes: `req(method, params)` → `res(ok/payload|error)`.
- Los eventos habituales incluyen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos del ciclo de vida de emparejamiento/aprobación y `shutdown`.

Las ejecuciones de agentes son de dos etapas:

1. Confirmación inmediata de aceptación (`status:"accepted"`)
2. Respuesta final de finalización (`status:"ok"|"error"`), con eventos `agent` transmitidos entre medias.

Consulta la documentación completa del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

## Comprobaciones operativas

### Vitalidad

- Abre WS y envía `connect`.
- Espera una respuesta `hello-ok` con instantánea.

### Preparación

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperación de lagunas

Los eventos no se vuelven a reproducir. En caso de lagunas de secuencia, actualiza el estado (`health`, `system-presence`) antes de continuar.

## Firmas de fallo habituales

| Firma                                                        | Problema probable                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                  | Enlace sin loopback sin una ruta de autenticación válida del Gateway            |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflicto de puerto                                                             |
| `Gateway start blocked: set gateway.mode=local`              | La configuración está en modo remoto, o falta la marca de modo local en una configuración dañada |
| `unauthorized` during connect                                | Desajuste de autenticación entre cliente y Gateway                              |

Para secuencias completas de diagnóstico, usa [Solución de problemas del Gateway](/es/gateway/troubleshooting).

## Garantías de seguridad

- Los clientes del protocolo del Gateway fallan rápido cuando el Gateway no está disponible (sin alternativa implícita de canal directo).
- Los primeros frames inválidos o que no sean `connect` se rechazan y se cierra la conexión.
- El apagado ordenado emite un evento `shutdown` antes del cierre del socket.

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
