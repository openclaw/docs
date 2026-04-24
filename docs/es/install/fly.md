---
read_when:
    - Desplegar OpenClaw en Fly.io
    - Configurar volúmenes, secretos y la configuración de la primera ejecución
summary: Despliegue paso a paso en Fly.io para OpenClaw con almacenamiento persistente y HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T05:34:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# Despliegue en Fly.io

**Objetivo:** Gateway de OpenClaw ejecutándose en una máquina de [Fly.io](https://fly.io) con almacenamiento persistente, HTTPS automático y acceso a Discord/canales.

## Qué necesitas

- [CLI `flyctl`](https://fly.io/docs/hands-on/install-flyctl/) instalado
- Cuenta de Fly.io (el nivel gratuito funciona)
- Autenticación del modelo: clave API para el proveedor de modelos que elijas
- Credenciales de canal: token de bot de Discord, token de Telegram, etc.

## Ruta rápida para principiantes

1. Clona el repositorio → personaliza `fly.toml`
2. Crea la app + volumen → establece secretos
3. Despliega con `fly deploy`
4. Entra por SSH para crear la configuración o usa la UI de Control

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

    **Consejo:** elige una región cercana a ti. Opciones comunes: `lhr` (Londres), `iad` (Virginia), `sjc` (San José).

  </Step>

  <Step title="Configurar fly.toml">
    Edita `fly.toml` para que coincida con el nombre de tu app y tus requisitos.

    **Nota de seguridad:** la configuración predeterminada expone una URL pública. Para un despliegue reforzado sin IP pública, consulta [Despliegue privado](#private-deployment-hardened) o usa `fly.private.toml`.

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

    **Ajustes clave:**

    | Ajuste | Motivo |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan` | Se enlaza a `0.0.0.0` para que el proxy de Fly pueda alcanzar el gateway |
    | `--allow-unconfigured` | Se inicia sin archivo de configuración (lo crearás después) |
    | `internal_port = 3000` | Debe coincidir con `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) para las comprobaciones de estado de Fly |
    | `memory = "2048mb"` | 512 MB es demasiado poco; se recomiendan 2 GB |
    | `OPENCLAW_STATE_DIR = "/data"` | Conserva el estado en el volumen |

  </Step>

  <Step title="Establecer secretos">
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

    - Los enlaces no loopback (`--bind lan`) requieren una ruta de autenticación válida de gateway. Este ejemplo de Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, pero `gateway.auth.password` o un despliegue `trusted-proxy` no loopback correctamente configurado también cumplen el requisito.
    - Trata estos tokens como contraseñas.
    - **Prefiere variables de entorno en lugar del archivo de configuración** para todas las claves API y tokens. Esto mantiene los secretos fuera de `openclaw.json`, donde podrían exponerse o registrarse accidentalmente.

  </Step>

  <Step title="Desplegar">
    ```bash
    fly deploy
    ```

    El primer despliegue compila la imagen Docker (~2-3 minutos). Los despliegues posteriores son más rápidos.

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
    Entra por SSH a la máquina para crear una configuración adecuada:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Nota:** con `OPENCLAW_STATE_DIR=/data`, la ruta de configuración es `/data/openclaw.json`.

    **Nota:** el token de Discord puede venir de:

    - Variable de entorno: `DISCORD_BOT_TOKEN` (recomendado para secretos)
    - Archivo de configuración: `channels.discord.token`

    Si usas variable de entorno, no es necesario agregar el token a la configuración. Gateway lee `DISCORD_BOT_TOKEN` automáticamente.

    Reinicia para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acceder a Gateway">
    ### UI de Control

    Abre en el navegador:

    ```bash
    fly open
    ```

    O visita `https://my-openclaw.fly.dev/`

    Autentícate con el secreto compartido configurado. Esta guía usa el token de gateway de `OPENCLAW_GATEWAY_TOKEN`; si cambiaste a autenticación por contraseña, usa esa contraseña en su lugar.

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

Gateway se está enlazando a `127.0.0.1` en lugar de `0.0.0.0`.

**Solución:** agrega `--bind lan` al comando del proceso en `fly.toml`.

### Fallan las comprobaciones de estado / conexión rechazada

Fly no puede alcanzar Gateway en el puerto configurado.

**Solución:** asegúrate de que `internal_port` coincida con el puerto del gateway (establece `--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Problemas de memoria

El contenedor sigue reiniciándose o siendo terminado. Señales: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o reinicios silenciosos.

**Solución:** aumenta la memoria en `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

O actualiza una máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512 MB es demasiado poco. 1 GB puede funcionar, pero puede entrar en OOM bajo carga o con registros detallados. **Se recomiendan 2 GB.**

### Problemas de bloqueo de Gateway

Gateway se niega a iniciarse con errores de “already running”.

Esto ocurre cuando el contenedor se reinicia, pero el archivo de bloqueo PID persiste en el volumen.

**Solución:** elimina el archivo de bloqueo:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

El archivo de bloqueo está en `/data/gateway.*.lock` (no en un subdirectorio).

### La configuración no se está leyendo

`--allow-unconfigured` solo omite la comprobación de inicio. No crea ni repara `/data/openclaw.json`, así que asegúrate de que tu configuración real exista e incluya `gateway.mode="local"` cuando quieras un inicio normal local de gateway.

Verifica que la configuración exista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Escribir configuración mediante SSH

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

### El estado no se conserva

Si pierdes perfiles de autenticación, estado de canal/proveedor o sesiones después de un reinicio,
el directorio de estado se está escribiendo en el sistema de archivos del contenedor.

**Solución:** asegúrate de que `OPENCLAW_STATE_DIR=/data` esté configurado en `fly.toml` y vuelve a desplegar.

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

**Nota:** después de `fly deploy`, el comando de la máquina puede volver a lo que está en `fly.toml`. Si hiciste cambios manuales, vuelve a aplicarlos después del despliegue.

## Despliegue privado (reforzado)

De forma predeterminada, Fly asigna IP públicas, haciendo que tu gateway sea accesible en `https://your-app.fly.dev`. Esto es práctico, pero significa que tu despliegue es detectable por escáneres de internet (Shodan, Censys, etc.).

Para un despliegue reforzado con **cero exposición pública**, usa la plantilla privada.

### Cuándo usar despliegue privado

- Solo haces llamadas/mensajes **salientes** (sin Webhooks entrantes)
- Usas túneles de **ngrok o Tailscale** para cualquier callback de Webhook
- Accedes al gateway mediante **SSH, proxy o WireGuard** en lugar de navegador
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

**Opción 1: proxy local (más simple)**

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

**Opción 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks con despliegue privado

Si necesitas callbacks de Webhook (Twilio, Telnyx, etc.) sin exposición pública:

1. **Túnel ngrok** - ejecuta ngrok dentro del contenedor o como sidecar
2. **Tailscale Funnel** - expón rutas específicas mediante Tailscale
3. **Solo salida** - algunos proveedores (Twilio) funcionan bien para llamadas salientes sin Webhooks

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

El túnel de ngrok se ejecuta dentro del contenedor y proporciona una URL pública de Webhook sin exponer la propia app de Fly. Establece `webhookSecurity.allowedHosts` en el hostname público del túnel para que se acepten los encabezados host reenviados.

### Beneficios de seguridad

| Aspecto | Público | Privado |
| ----------------- | ------------ | ---------- |
| Escáneres de internet | Detectable | Oculto |
| Ataques directos | Posibles | Bloqueados |
| Acceso a la UI de Control | Navegador | Proxy/VPN |
| Entrega de Webhook | Directa | A través de túnel |

## Notas

- Fly.io usa arquitectura **x86** (no ARM)
- El Dockerfile es compatible con ambas arquitecturas
- Para la incorporación de WhatsApp/Telegram, usa `fly ssh console`
- Los datos persistentes viven en el volumen en `/data`
- Signal requiere Java + `signal-cli`; usa una imagen personalizada y mantén la memoria en 2 GB o más.

## Costo

Con la configuración recomendada (`shared-cpu-2x`, 2 GB RAM):

- ~\$10-15/mes dependiendo del uso
- El nivel gratuito incluye cierta asignación

Consulta [precios de Fly.io](https://fly.io/docs/about/pricing/) para más detalles.

## Siguientes pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura Gateway: [Configuración de Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)

## Relacionado

- [Resumen de instalación](/es/install)
- [Hetzner](/es/install/hetzner)
- [Docker](/es/install/docker)
- [Alojamiento VPS](/es/vps)
