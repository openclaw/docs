---
read_when:
    - Implementar OpenClaw en Fly.io
    - Configurar volúmenes de Fly, secretos y la configuración de primera ejecución
summary: Despliegue paso a paso de OpenClaw en Fly.io con almacenamiento persistente y HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-30T05:47:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# Despliegue en Fly.io

**Objetivo:** Gateway de OpenClaw ejecutándose en una máquina de [Fly.io](https://fly.io) con almacenamiento persistente, HTTPS automático y acceso a Discord/canales.

## Lo que necesitas

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) instalado
- Cuenta de Fly.io (el nivel gratuito sirve)
- Autenticación del modelo: clave de API para el proveedor de modelos que elijas
- Credenciales de canales: token de bot de Discord, token de Telegram, etc.

## Ruta rápida para principiantes

1. Clonar el repositorio → personalizar `fly.toml`
2. Crear la app + volumen → definir secretos
3. Desplegar con `fly deploy`
4. Entrar por SSH para crear la configuración o usar la Control UI

<Steps>
  <Step title="Create the Fly app">
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

  <Step title="Configure fly.toml">
    Edita `fly.toml` para que coincida con el nombre y los requisitos de tu app.

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

    | Configuración                  | Motivo                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Enlaza a `0.0.0.0` para que el proxy de Fly pueda acceder al gateway        |
    | `--allow-unconfigured`         | Inicia sin un archivo de configuración (lo crearás después)                 |
    | `internal_port = 3000`         | Debe coincidir con `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) para las comprobaciones de salud de Fly |
    | `memory = "2048mb"`            | 512 MB es demasiado poco; se recomiendan 2 GB                               |
    | `OPENCLAW_STATE_DIR = "/data"` | Conserva el estado en el volumen                                            |

  </Step>

  <Step title="Set secrets">
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

    - Los enlaces que no son local loopback (`--bind lan`) requieren una ruta válida de autenticación del gateway. Este ejemplo de Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, pero `gateway.auth.password` o un despliegue `trusted-proxy` no local loopback configurado correctamente también cumplen el requisito.
    - Trata estos tokens como contraseñas.
    - **Prefiere variables de entorno en lugar del archivo de configuración** para todas las claves de API y tokens. Esto mantiene los secretos fuera de `openclaw.json`, donde podrían exponerse o registrarse accidentalmente.

  </Step>

  <Step title="Deploy">
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

  <Step title="Create config file">
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

    **Nota:** Sustituye `https://my-openclaw.fly.dev` por el origen real de tu app de Fly. El inicio del Gateway siembra los orígenes locales de la Control UI desde los valores de ejecución `--bind` y `--port` para que el primer arranque pueda continuar antes de que exista la configuración, pero el acceso del navegador a través de Fly sigue necesitando el origen HTTPS exacto listado en `gateway.controlUi.allowedOrigins`.

    **Nota:** El token de Discord puede venir de cualquiera de estas fuentes:

    - Variable de entorno: `DISCORD_BOT_TOKEN` (recomendado para secretos)
    - Archivo de configuración: `channels.discord.token`

    Si usas una variable de entorno, no hace falta añadir el token a la configuración. El gateway lee `DISCORD_BOT_TOKEN` automáticamente.

    Reinicia para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    Abre en el navegador:

    ```bash
    fly open
    ```

    O visita `https://my-openclaw.fly.dev/`

    Autentícate con el secreto compartido configurado. Esta guía usa el token del gateway de `OPENCLAW_GATEWAY_TOKEN`; si cambiaste a autenticación con contraseña, usa esa contraseña en su lugar.

    ### Registros

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### Consola SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Solución de problemas

### "App is not listening on expected address"

El gateway se está enlazando a `127.0.0.1` en lugar de `0.0.0.0`.

**Corrección:** Añade `--bind lan` al comando del proceso en `fly.toml`.

### Comprobaciones de salud fallando / conexión rechazada

Fly no puede acceder al gateway en el puerto configurado.

**Corrección:** Asegúrate de que `internal_port` coincida con el puerto del gateway (define `--port 3000` u `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemas de memoria

El contenedor sigue reiniciándose o el sistema lo mata. Señales: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o reinicios silenciosos.

**Corrección:** Aumenta la memoria en `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

O actualiza una máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512 MB es demasiado poco. 1 GB puede funcionar, pero puede provocar OOM bajo carga o con registros detallados. **Se recomiendan 2 GB.**

### Problemas con el bloqueo del Gateway

El Gateway se niega a iniciar con errores de "already running".

Esto ocurre cuando el contenedor se reinicia, pero el archivo de bloqueo de PID persiste en el volumen.

**Corrección:** Elimina el archivo de bloqueo:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

El archivo de bloqueo está en `/data/gateway.*.lock` (no en un subdirectorio).

### La configuración no se lee

`--allow-unconfigured` solo omite la protección de inicio. No crea ni repara `/data/openclaw.json`, así que asegúrate de que tu configuración real exista e incluya `gateway.mode="local"` cuando quieras un inicio normal del gateway local.

Verifica que la configuración exista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Escribir configuración por SSH

El comando `fly ssh console -C` no admite redirección de shell. Para escribir un archivo de configuración:

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

### El estado no persiste

Si pierdes perfiles de autenticación, estado de canales/proveedores o sesiones después de un reinicio, el directorio de estado está escribiendo en el sistema de archivos del contenedor.

**Corrección:** Asegúrate de que `OPENCLAW_STATE_DIR=/data` esté definido en `fly.toml` y vuelve a desplegar.

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

Si necesitas cambiar el comando de inicio sin un redespliegue completo:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Nota:** Después de `fly deploy`, el comando de la máquina puede restablecerse a lo que haya en `fly.toml`. Si hiciste cambios manuales, vuelve a aplicarlos después del despliegue.

## Despliegue privado (reforzado)

De forma predeterminada, Fly asigna IP públicas, lo que hace que tu gateway sea accesible en `https://your-app.fly.dev`. Esto es cómodo, pero significa que tu despliegue es visible para escáneres de internet (Shodan, Censys, etc.).

Para un despliegue reforzado sin **exposición pública**, usa la plantilla privada.

### Cuándo usar el despliegue privado

- Solo haces llamadas/mensajes **salientes** (sin Webhook entrantes)
- Usas túneles de **ngrok o Tailscale** para cualquier callback de Webhook
- Accedes al gateway mediante **SSH, proxy o WireGuard** en lugar del navegador
- Quieres que el despliegue esté **oculto de los escáneres de internet**

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

**Opción 1: Proxy local (lo más sencillo)**

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

### Webhook con despliegue privado

Si necesitas devoluciones de llamada de Webhook (Twilio, Telnyx, etc.) sin exposición pública:

1. **Túnel ngrok** - Ejecuta ngrok dentro del contenedor o como sidecar
2. **Tailscale Funnel** - Expón rutas específicas mediante Tailscale
3. **Solo salida** - Algunos proveedores (Twilio) funcionan bien para llamadas salientes sin Webhook

Ejemplo de configuración de llamada de voz con ngrok:

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

El túnel ngrok se ejecuta dentro del contenedor y proporciona una URL pública de Webhook sin exponer la propia aplicación Fly. Configura `webhookSecurity.allowedHosts` con el nombre de host público del túnel para que se acepten los encabezados de host reenviados.

### Beneficios de seguridad

| Aspecto               | Público      | Privado        |
| --------------------- | ------------ | -------------- |
| Escáneres de Internet | Detectable   | Oculto         |
| Ataques directos      | Posibles     | Bloqueados     |
| Acceso a la IU de control | Navegador | Proxy/VPN      |
| Entrega de Webhook    | Directa      | Mediante túnel |

## Notas

- Fly.io usa **arquitectura x86** (no ARM)
- El Dockerfile es compatible con ambas arquitecturas
- Para la incorporación de WhatsApp/Telegram, usa `fly ssh console`
- Los datos persistentes residen en el volumen en `/data`
- Signal requiere Java + signal-cli; usa una imagen personalizada y mantén la memoria en 2 GB o más.

## Costo

Con la configuración recomendada (`shared-cpu-2x`, 2 GB de RAM):

- ~$10-15/mes según el uso
- El nivel gratuito incluye cierta asignación

Consulta [precios de Fly.io](https://fly.io/docs/about/pricing/) para obtener más detalles.

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)

## Relacionado

- [Resumen de instalación](/es/install)
- [Hetzner](/es/install/hetzner)
- [Docker](/es/install/docker)
- [Alojamiento VPS](/es/vps)
