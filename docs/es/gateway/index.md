---
read_when:
    - Ejecutar o depurar el proceso del Gateway
summary: Guía operativa del servicio Gateway, su ciclo de vida y sus operaciones
title: Guía operativa de Gateway
x-i18n:
    generated_at: "2026-04-30T05:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Usa esta página para el arranque del día 1 y las operaciones del día 2 del servicio Gateway.

<CardGroup cols={2}>
  <Card title="Solución de problemas profunda" icon="siren" href="/es/gateway/troubleshooting">
    Diagnósticos orientados por síntomas con secuencias exactas de comandos y firmas de registro.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Guía de configuración orientada a tareas + referencia completa de configuración.
  </Card>
  <Card title="Gestión de secretos" icon="key-round" href="/es/gateway/secrets">
    Contrato SecretRef, comportamiento de instantánea en tiempo de ejecución y operaciones de migración/recarga.
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

  <Step title="Verifica la salud del servicio">

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

Con un gateway accesible, esto ejecuta sondeos de canales por cuenta en vivo y auditorías opcionales.
Si no se puede acceder al gateway, la CLI vuelve a resúmenes de canales solo de configuración en lugar
de la salida del sondeo en vivo.

  </Step>
</Steps>

<Note>
La recarga de configuración del Gateway observa la ruta del archivo de configuración activo (resuelta desde los valores predeterminados de perfil/estado, o `OPENCLAW_CONFIG_PATH` cuando está definido).
El modo predeterminado es `gateway.reload.mode="hybrid"`.
Después de la primera carga correcta, el proceso en ejecución sirve la instantánea de configuración activa en memoria; una recarga correcta sustituye esa instantánea de forma atómica.
</Note>

## Modelo de tiempo de ejecución

- Un proceso siempre activo para enrutamiento, plano de control y conexiones de canales.
- Un único puerto multiplexado para:
  - Control/RPC de WebSocket
  - API HTTP, compatibles con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI y hooks
- Modo de enlace predeterminado: `loopback`.
- La autenticación es obligatoria por defecto. Las configuraciones con secreto compartido usan
  `gateway.auth.token` / `gateway.auth.password` (o
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), y las configuraciones de proxy inverso no local loopback
  pueden usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatibles con OpenAI

La superficie de compatibilidad de mayor impacto de OpenClaw ahora es:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por qué importa este conjunto:

- La mayoría de las integraciones con Open WebUI, LobeChat y LibreChat sondean primero `/v1/models`.
- Muchas canalizaciones de RAG y memoria esperan `/v1/embeddings`.
- Los clientes nativos para agentes prefieren cada vez más `/v1/responses`.

Nota de planificación:

- `/v1/models` prioriza agentes: devuelve `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
- `openclaw/default` es el alias estable que siempre se asigna al agente predeterminado configurado.
- Usa `x-openclaw-model` cuando quieras una anulación del proveedor/modelo backend; de lo contrario, la configuración normal de modelo e incrustaciones del agente seleccionado mantiene el control.

Todos estos se ejecutan en el puerto principal del Gateway y usan el mismo límite de autenticación de operador de confianza que el resto de la API HTTP del Gateway.

### Precedencia de puerto y enlace

| Configuración | Orden de resolución                                           |
| ------------ | ------------------------------------------------------------- |
| Puerto Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de enlace | CLI/anulación → `gateway.bind` → `loopback`                    |

Los servicios gateway instalados registran el `--port` resuelto en los metadatos del supervisor. Después de cambiar `gateway.port`, ejecuta `openclaw doctor --fix` o `openclaw gateway install --force` para que launchd/systemd/schtasks inicie el proceso en el nuevo puerto.

El arranque del Gateway usa el mismo puerto y enlace efectivos cuando inicializa los orígenes locales de
Control UI para enlaces no local loopback. Por ejemplo, `--bind lan --port 3000`
inicializa `http://localhost:3000` y `http://127.0.0.1:3000` antes de que se ejecute la
validación en tiempo de ejecución. Agrega explícitamente cualquier origen de navegador remoto, como URLs de proxy HTTPS, a
`gateway.controlUi.allowedOrigins`.

### Modos de recarga en caliente

| `gateway.reload.mode` | Comportamiento                             |
| --------------------- | ------------------------------------------ |
| `off`                 | Sin recarga de configuración               |
| `hot`                 | Aplica solo cambios seguros en caliente    |
| `restart`             | Reinicia ante cambios que requieren recarga |
| `hybrid` (predeterminado) | Aplica en caliente cuando es seguro, reinicia cuando se requiere |

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

`gateway status --deep` sirve para descubrimiento adicional de servicios (LaunchDaemons/unidades systemd del sistema/schtasks), no para un sondeo más profundo de salud RPC.

## Varios gateways (mismo host)

La mayoría de las instalaciones deberían ejecutar un gateway por máquina. Un solo gateway puede alojar varios
agentes y canales.

Solo necesitas varios gateways cuando deseas aislamiento intencionalmente o un bot de rescate.

Comprobaciones útiles:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Qué esperar:

- `gateway status --deep` puede informar `Other gateway-like services detected (best effort)`
  e imprimir sugerencias de limpieza cuando aún queden instalaciones launchd/systemd/schtasks obsoletas.
- `gateway probe` puede advertir sobre `multiple reachable gateways` cuando responde más de un destino.
- Si eso es intencional, aísla puertos, configuración/estado y raíces de espacio de trabajo por gateway.

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
`/voiceclaw/realtime`. Úsalo cuando un cliente de escritorio VoiceClaw deba comunicarse
directamente con un cerebro OpenClaw en tiempo real en lugar de pasar por un proceso
de retransmisión separado.

El endpoint usa Gemini Live para audio en tiempo real y llama a OpenClaw como
cerebro exponiendo herramientas de OpenClaw directamente a Gemini Live. Las llamadas a herramientas devuelven un
resultado `working` inmediato para mantener ágil el turno de voz; luego OpenClaw
ejecuta la herramienta real de forma asíncrona e inyecta el resultado de vuelta en la
sesión en vivo. Define `GEMINI_API_KEY` en el entorno del proceso gateway. Si
la autenticación del gateway está habilitada, el cliente de escritorio envía el token o la contraseña del gateway
en su primer mensaje `session.config`.

El acceso al cerebro en tiempo real ejecuta comandos de agente OpenClaw autorizados por el propietario. Mantén
`gateway.auth.mode: "none"` limitado a instancias de prueba solo local loopback. Las conexiones de cerebro en tiempo real
no locales requieren autenticación del gateway.

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
Los túneles SSH no omiten la autenticación del gateway. Para autenticación con secreto compartido, los clientes todavía
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

Usa `openclaw gateway restart` para reinicios. No encadenes `openclaw gateway stop` y `openclaw gateway start`; en macOS, `gateway stop` deshabilita intencionalmente el LaunchAgent antes de detenerlo.

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

El arranque gestionado nativo de Windows usa una tarea programada llamada `OpenClaw Gateway`
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
`ExecStart=` si tu binario `openclaw` vive en otro lugar.

No permitas también que `openclaw doctor --fix` instale un servicio gateway a nivel de usuario para el mismo perfil/puerto. Doctor rechaza esa instalación automática cuando encuentra un servicio gateway OpenClaw a nivel de sistema; usa `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando la unidad del sistema es dueña del ciclo de vida.

  </Tab>
</Tabs>

## Ruta rápida de perfil de desarrollo

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Los valores predeterminados incluyen estado/configuración aislados y el puerto gateway base `19001`.

## Referencia rápida del protocolo (vista de operador)

- La primera trama del cliente debe ser `connect`.
- Gateway devuelve una instantánea `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, límites/política).
- `hello-ok.features.methods` / `events` son una lista de descubrimiento conservadora, no
  un volcado generado de cada ruta auxiliar invocable.
- Solicitudes: `req(method, params)` → `res(ok/payload|error)`.
- Los eventos comunes incluyen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de emparejamiento/aprobación y `shutdown`.

Las ejecuciones de agente tienen dos etapas:

1. Confirmación aceptada inmediata (`status:"accepted"`)
2. Respuesta final de finalización (`status:"ok"|"error"`), con eventos `agent` transmitidos entre ambas.

Consulta la documentación completa del protocolo: [Protocolo de Gateway](/es/gateway/protocol).

## Comprobaciones operativas

### Actividad

- Abra WS y envíe `connect`.
- Espere una respuesta `hello-ok` con instantánea.

### Preparación

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperación de brechas

Los eventos no se reproducen. Ante brechas de secuencia, actualice el estado (`health`, `system-presence`) antes de continuar.

## Firmas de fallo comunes

| Firma                                                          | Problema probable                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Enlace no loopback sin una ruta de autenticación de Gateway válida             |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflicto de puerto                                                            |
| `Gateway start blocked: set gateway.mode=local`                | Configuración establecida en modo remoto, o falta la marca de modo local en una configuración dañada |
| `unauthorized` during connect                                  | Discrepancia de autenticación entre el cliente y el Gateway                    |

Para ver las cadenas completas de diagnóstico, use [Solución de problemas de Gateway](/es/gateway/troubleshooting).

## Garantías de seguridad

- Los clientes del protocolo de Gateway fallan rápidamente cuando Gateway no está disponible (sin alternativa implícita al canal directo).
- Las primeras tramas no válidas/no connect se rechazan y se cierran.
- El apagado ordenado emite el evento `shutdown` antes de cerrar el socket.

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
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
- [Acceso remoto](/es/gateway/remote)
- [Gestión de secretos](/es/gateway/secrets)
