---
read_when:
    - Desplegar OpenClaw en Fly.io
    - Configurar volúmenes, secretos y la configuración de la primera ejecución
summary: Despliegue paso a paso en Fly.io para OpenClaw con almacenamiento persistente y HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:31:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Despliegue en Fly.io

**Objetivo:** Gateway de OpenClaw ejecutándose en una máquina de [Fly.io](https://fly.io) con almacenamiento persistente, HTTPS automático y acceso a Discord/canales.

## Lo que necesitas

- [CLI `flyctl`](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Cuenta de Fly.io (el nivel gratuito funciona)
- Autenticación del modelo: clave API para el proveedor de modelos que elijas
- Credenciales de canal: token de bot de Discord, token de Telegram, etc.

## Ruta rápida para principiantes

1. Clona el repositorio → personaliza `fly.toml`
2. Crea app + volumen → configura secretos
3. Despliega con `fly deploy`
4. Entra por SSH para crear la configuración o usa Control UI

<Steps>
  <Step title="Crear la app de Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Consejo:** Elige una región cercana a ti. Opciones comunes: `lhr` (Londres), `iad` (Virginia), `sjc` (San José).

  </Step>

  <Step title="Configurar fly.toml">
    Edita `fly.toml` para que coincida con el nombre de tu app y tus requisitos.

    **Nota de seguridad:** La configuración predeterminada expone una URL pública. Para un despliegue reforzado sin IP pública, consulta [Despliegue privado](#private-deployment-hardened) o usa `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Configuraciones clave:**

    | Configuración                 | Por qué                                                                     |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Vincula a `0.0.0.0` para que el proxy de Fly pueda llegar al gateway        |
    | `--allow-unconfigured`        | Inicia sin archivo de configuración (lo crearás después)                    |
    | `internal_port = 3000`        | Debe coincidir con `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) para los health checks de Fly |
    | `memory = "2048mb"`           | 512MB es demasiado poco; se recomiendan 2GB                                 |
    | `OPENCLAW_STATE_DIR = "/data"` | Conserva el estado en el volumen                                           |

  </Step>

  <Step title="Configurar secretos">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Notas:**

    - Los binds no loopback (`--bind lan`) requieren una ruta válida de autenticación del gateway. Este ejemplo de Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, pero `gateway.auth.password` o un despliegue `trusted-proxy` no loopback configurado correctamente también satisfacen el requisito.
    - Trata estos tokens como contraseñas.
    - **Prefiere variables de entorno en lugar del archivo de configuración** para todas las claves API y tokens. Esto mantiene los secretos fuera de `openclaw.json`, donde podrían exponerse o registrarse accidentalmente.

  </Step>

  <Step title="Desplegar">
    ```bash
    fly deploy
    ```

    El primer despliegue compila la imagen de Docker (~2-3 minutos). Los despliegues posteriores son más rápidos.

    Después del despliegue, verifica:

    ```bash
    fly status
    fly logs
    ```

    Deberías ver:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Crear archivo de configuración">
    Entra por SSH en la máquina para crear una configuración adecuada:

    ```bash
    fly ssh console
    ```

    Crea el directorio y el archivo de configuración:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Nota:** Con `OPENCLAW_STATE_DIR=/data`, la ruta de configuración es `/data/openclaw.json`.

    **Nota:** Sustituye `https://my-openclaw.fly.dev` por el origen real
    de tu app de Fly. El arranque del Gateway inicializa los orígenes locales de Control UI a partir de los valores de runtime
    `--bind` y `--port`, de modo que el primer arranque pueda continuar antes de que exista la configuración,
    pero el acceso desde el navegador a través de Fly sigue necesitando que el origen HTTPS exacto esté listado en
    `gateway.controlUi.allowedOrigins`.

    **Nota:** El token de Discord puede venir de:

    - Variable de entorno: `DISCORD_BOT_TOKEN` (recomendado para secretos)
    - Archivo de configuración: `channels.discord.token`

    Si usas la variable de entorno, no hace falta añadir el token a la configuración. El gateway lee `DISCORD_BOT_TOKEN` automáticamente.

    Reinicia para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acceder al Gateway">
    ### Control UI

    Ábrelo en el navegador:

    ```bash
    fly open
    ```

    O visita `https://my-openclaw.fly.dev/`

    Autentícate con el secreto compartido configurado. Esta guía usa el token del gateway
    de `OPENCLAW_GATEWAY_TOKEN`; si cambiaste a autenticación por contraseña, usa
    esa contraseña en su lugar.

    ### Logs

    ```bash
    fly logs              # Logs en vivo
    fly logs --no-tail    # Logs recientes
    ```

    ### Consola SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Resolución de problemas

### "App is not listening on expected address"

El gateway se está vinculando a `127.0.0.1` en lugar de `0.0.0.0`.

**Solución:** Añade `--bind lan` a tu comando de proceso en `fly.toml`.

### Fallan los health checks / conexión rechazada

Fly no puede llegar al gateway en el puerto configurado.

**Solución:** Asegúrate de que `internal_port` coincide con el puerto del gateway (configura `--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Problemas de memoria

El contenedor sigue reiniciándose o siendo finalizado. Señales: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o reinicios silenciosos.

**Solución:** Aumenta la memoria en `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

O actualiza una máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512MB es demasiado poco. 1GB puede funcionar, pero puede causar OOM bajo carga o con logging detallado. **Se recomiendan 2GB.**

### Problemas de bloqueo del Gateway

El Gateway se niega a iniciar con errores de "already running".

Esto ocurre cuando el contenedor se reinicia, pero el archivo de bloqueo PID persiste en el volumen.

**Solución:** Elimina el archivo de bloqueo:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

El archivo de bloqueo está en `/data/gateway.*.lock` (no en un subdirectorio).

### La configuración no se está leyendo

`--allow-unconfigured` solo omite la protección de arranque. No crea ni repara `/data/openclaw.json`, así que asegúrate de que tu configuración real exista e incluya `gateway.mode="local"` cuando quieras un arranque local normal del gateway.

Verifica que la configuración existe:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Escribir configuración mediante SSH

El comando `fly ssh console -C` no admite redirección del shell. Para escribir un archivo de configuración:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Nota:** `fly sftp` puede fallar si el archivo ya existe. Elimínalo primero:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### El estado no se conserva

Si pierdes perfiles de autenticación, estado de canal/proveedor o sesiones después de un reinicio,
el directorio de estado está escribiendo en el sistema de archivos del contenedor.

**Solución:** Asegúrate de que `OPENCLAW_STATE_DIR=/data` esté configurado en `fly.toml` y vuelve a desplegar.

## Actualizaciones

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Actualizar el comando de la máquina

Si necesitas cambiar el comando de arranque sin un redespliegue completo:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Nota:** Después de `fly deploy`, el comando de la máquina puede volver a lo que está en `fly.toml`. Si hiciste cambios manuales, vuelve a aplicarlos después del despliegue.

## Despliegue privado (reforzado)

De forma predeterminada, Fly asigna IP públicas, haciendo que tu gateway sea accesible en `https://your-app.fly.dev`. Esto es práctico, pero significa que tu despliegue puede ser detectado por escáneres de internet (Shodan, Censys, etc.).

Para un despliegue reforzado con **cero exposición pública**, usa la plantilla privada.

### Cuándo usar despliegue privado

- Solo haces llamadas/mensajes **salientes** (sin Webhooks entrantes)
- Usas túneles **ngrok o Tailscale** para callbacks de Webhook
- Accedes al gateway mediante **SSH, proxy o WireGuard** en lugar del navegador
- Quieres que el despliegue quede **oculto a los escáneres de internet**

### Configuración

Usa `fly.private.toml` en lugar de la configuración estándar:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

O convierte un despliegue existente:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Después de esto, `fly ips list` debería mostrar solo una IP de tipo `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Acceder a un despliegue privado

Como no hay URL pública, usa uno de estos métodos:

**Opción 1: Proxy local (la más simple)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Opción 2: VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Opción 3: Solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks con despliegue privado

Si necesitas callbacks de Webhook (Twilio, Telnyx, etc.) sin exposición pública:

1. **Túnel ngrok**: ejecuta ngrok dentro del contenedor o como sidecar
2. **Tailscale Funnel**: expón rutas concretas mediante Tailscale
3. **Solo saliente**: algunos proveedores (Twilio) funcionan bien para llamadas salientes sin Webhooks

Ejemplo de configuración de llamadas de voz con ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

El túnel de ngrok se ejecuta dentro del contenedor y proporciona una URL pública de Webhook sin exponer la propia app de Fly. Configura `webhookSecurity.allowedHosts` con el nombre de host público del túnel para que se acepten los encabezados de host reenviados.

### Ventajas de seguridad

| Aspecto           | Público      | Privado    |
| ----------------- | ------------ | ---------- |
| Escáneres de internet | Detectable | Oculto     |
| Ataques directos  | Posibles     | Bloqueados |
| Acceso a Control UI | Navegador  | Proxy/VPN  |
| Entrega de Webhook | Directa     | Mediante túnel |

## Notas

- Fly.io usa arquitectura **x86** (no ARM)
- El Dockerfile es compatible con ambas arquitecturas
- Para la incorporación de WhatsApp/Telegram, usa `fly ssh console`
- Los datos persistentes viven en el volumen en `/data`
- Signal requiere Java + `signal-cli`; usa una imagen personalizada y mantén la memoria en 2GB o más.

## Coste

Con la configuración recomendada (`shared-cpu-2x`, 2GB RAM):

- ~10-15 USD/mes según el uso
- El nivel gratuito incluye cierto margen

Consulta [Precios de Fly.io](https://fly.io/docs/about/pricing/) para más detalles.

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)

## Relacionado

- [Descripción general de la instalación](/es/install)
- [Hetzner](/es/install/hetzner)
- [Docker](/es/install/docker)
- [Alojamiento VPS](/es/vps)
