---
read_when:
    - Implementar OpenClaw en Fly.io
    - Configurar volúmenes, secretos y configuración de primer inicio de Fly
summary: Implementación paso a paso de OpenClaw en Fly.io con almacenamiento persistente y HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-05T11:23:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Objetivo:** OpenClaw Gateway ejecutándose en una máquina de [Fly.io](https://fly.io) con almacenamiento persistente, HTTPS automático y acceso a Discord/canales.

## Lo que necesitas

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Cuenta de Fly.io (el nivel gratuito funciona)
- Autenticación del modelo: clave de API para el proveedor de modelos elegido
- Credenciales de canal: token de bot de Discord, token de Telegram, etc.

## Ruta rápida para principiantes

1. Clona el repositorio, personaliza `fly.toml`
2. Crea la app y el volumen, configura los secretos
3. Despliega con `fly deploy`
4. Entra por SSH para crear la configuración, o usa la Control UI

<Steps>
  <Step title="Crear la app de Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # pick your own name
    fly apps create my-openclaw

    # 1GB is usually enough
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Elige una región cercana a ti. Opciones comunes: `lhr` (Londres), `iad` (Virginia), `sjc` (San José).

  </Step>

  <Step title="Configurar fly.toml">
    Edita `fly.toml` para que coincida con el nombre de tu app y tus requisitos. El `fly.toml` rastreado del repositorio es la plantilla pública que se muestra abajo; `deploy/fly.private.toml` es la variante reforzada sin IP pública (consulta [Despliegue privado](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # your app name
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

    El punto de entrada de la imagen Docker de OpenClaw es `tini`, que ejecuta `node openclaw.mjs gateway` de forma predeterminada. Fly `[processes]` reemplaza el `CMD` de Docker (aquí ejecuta `node dist/index.js gateway ...` directamente, el mismo punto de entrada compilado) sin tocar `ENTRYPOINT`, por lo que el proceso sigue ejecutándose bajo `tini`.

    **Configuración clave:**

    | Ajuste                         | Motivo                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Se enlaza a `0.0.0.0` para que el proxy de Fly pueda llegar al Gateway      |
    | `--allow-unconfigured`         | Inicia sin archivo de configuración (lo creas después)                      |
    | `internal_port = 3000`         | Debe coincidir con `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) para las comprobaciones de estado de Fly |
    | `memory = "2048mb"`            | 512 MB es demasiado poco; se recomiendan 2 GB                               |
    | `OPENCLAW_STATE_DIR = "/data"` | Persiste el estado en el volumen                                            |

  </Step>

  <Step title="Configurar secretos">
    ```bash
    # required: gateway auth token for non-loopback binding
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # optional: other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Los enlaces que no son local loopback (`--bind lan`) requieren una ruta válida de autenticación del Gateway. Este ejemplo usa `OPENCLAW_GATEWAY_TOKEN`, pero `gateway.auth.password` o un despliegue de proxy de confianza que no sea local loopback correctamente configurado también satisfacen el requisito. Consulta [Gestión de secretos](/es/gateway/secrets) para el contrato SecretRef.

    Trata estos tokens como contraseñas. Prefiere variables de entorno/`fly secrets` frente al archivo de configuración para claves de API y tokens, de modo que los secretos no queden en `openclaw.json`.

  </Step>

  <Step title="Desplegar">
    ```bash
    fly deploy
    ```

    El primer despliegue compila la imagen Docker. Verifica después del despliegue:

    ```bash
    fly status
    fly logs
    ```

    Los registros de inicio del Gateway muestran `gateway ready` cuando el listener HTTP/WebSocket está activo. La propia comprobación de estado de Fly supervisa `internal_port = 3000` según `fly.toml`; la directiva Docker `HEALTHCHECK` de la imagen además consulta `/healthz` en su puerto predeterminado 18789, que aquí no se usa porque este despliegue sobrescribe el Gateway a `--port 3000`.

  </Step>

  <Step title="Crear archivo de configuración">
    Entra por SSH en la máquina para crear una configuración adecuada:

    ```bash
    fly ssh console
    ```

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

    Con `OPENCLAW_STATE_DIR=/data`, la ruta de configuración es `/data/openclaw.json`.

    Reemplaza `https://my-openclaw.fly.dev` por el origen real de tu app de Fly. El inicio del Gateway siembra los orígenes locales de Control UI a partir de los valores de runtime `--bind` y `--port`, de modo que el primer arranque pueda continuar antes de que exista la configuración, pero el acceso del navegador a través de Fly sigue necesitando el origen HTTPS exacto listado en `gateway.controlUi.allowedOrigins`.

    El token de Discord puede venir de cualquiera de estos lugares:

    - Variable de entorno `DISCORD_BOT_TOKEN` (recomendado para secretos); no hace falta añadirlo a la configuración, el Gateway lo lee automáticamente
    - Archivo de configuración `channels.discord.token`

    Reinicia para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acceder al Gateway">
    ### Control UI

    ```bash
    fly open
    ```

    O visita `https://my-openclaw.fly.dev/`.

    Autentícate con el secreto compartido configurado: el token del Gateway de `OPENCLAW_GATEWAY_TOKEN`, o tu contraseña si cambiaste a autenticación con contraseña.

    ### Registros

    ```bash
    fly logs              # live logs
    fly logs --no-tail    # recent logs
    ```

    ### Consola SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Solución de problemas

### "La app no está escuchando en la dirección esperada"

El Gateway se está vinculando a `127.0.0.1` en lugar de `0.0.0.0`.

**Corrección:** agrega `--bind lan` al comando de tu proceso en `fly.toml`.

### Fallan las comprobaciones de estado / conexión rechazada

Fly no puede alcanzar el Gateway en el puerto configurado.

**Corrección:** asegúrate de que `internal_port` coincida con el puerto del Gateway (`--port 3000` u `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemas de memoria

El contenedor sigue reiniciándose o siendo terminado. Señales: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o reinicios silenciosos.

**Corrección:** aumenta la memoria en `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

O actualiza una máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB es demasiado poco. 1 GB puede funcionar, pero puede quedarse sin memoria bajo carga o con registros detallados. Se recomiendan 2 GB.

### Problemas con el bloqueo del Gateway

El Gateway se niega a iniciar con errores de "already running" después de un reinicio del contenedor.

El archivo de bloqueo de instancia única reside en `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), no en el volumen persistente `/data`, por lo que un reinicio completo del contenedor normalmente lo borra junto con el resto del sistema de archivos del contenedor. Si el bloqueo sobrevive (por ejemplo, un `fly machine restart` que conserva el sistema de archivos del contenedor) y bloquea el inicio, elimínalo manualmente:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### La configuración no se lee

`--allow-unconfigured` solo omite la protección de inicio. No crea ni repara `/data/openclaw.json`, así que asegúrate de que tu configuración real exista e incluya `"gateway": { "mode": "local" }` para un inicio normal del Gateway local.

Verifica que la configuración exista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Escribir configuración mediante SSH

`fly ssh console -C` no admite redirección de shell. Para escribir un archivo de configuración:

```bash
# echo + tee (canaliza desde local al remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# o sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` puede fallar si el archivo ya existe; elimínalo primero:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### El estado no persiste

Si pierdes perfiles de autenticación, estado de canal/proveedor o sesiones después de un reinicio, el directorio de estado está escribiendo en el sistema de archivos del contenedor en lugar del volumen.

**Corrección:** asegúrate de que `OPENCLAW_STATE_DIR=/data` esté configurado en `fly.toml` y vuelve a desplegar.

## Actualización

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` es la ruta supervisada aquí: reconstruye la imagen desde el Dockerfile, por lo que la versión de la CLI/Gateway, la imagen base del sistema operativo y cualquier cambio del Dockerfile se actualizan juntos. `openclaw update` dentro del contenedor en ejecución no es la misma operación, ya que la imagen se distribuye como un árbol `dist/` construido con Docker sin checkout de `.git` ni instalación global administrada por npm que pueda detectar; consulta [Actualización](/es/install/updating) para ese flujo en instalaciones de tipo VM.

### Actualizar el comando de la máquina

Para cambiar el comando de inicio sin un redespliegue completo:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# o con un aumento de memoria
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Un `fly deploy` posterior restablece el comando de la máquina a lo que esté en `fly.toml`; vuelve a aplicar los cambios manuales después de redesplegar.

## Despliegue privado (reforzado)

De forma predeterminada, Fly asigna direcciones IP públicas, por lo que tu Gateway es accesible en `https://your-app.fly.dev` y detectable por escáneres de internet (Shodan, Censys, etc.).

Usa `deploy/fly.private.toml` para un despliegue reforzado **sin IP pública**: omite `[http_service]`, por lo que no se asigna entrada pública.

### Cuándo usar un despliegue privado

- Solo llamadas/mensajes salientes (sin Webhook entrantes)
- Los túneles de ngrok o Tailscale gestionan cualquier devolución de llamada de Webhook
- El acceso al Gateway es mediante SSH, proxy o WireGuard en lugar de un navegador
- El despliegue debe estar oculto de los escáneres de internet

### Configuración

```bash
fly deploy -c deploy/fly.private.toml
```

O convierte un despliegue existente:

```bash
# listar las IP actuales
fly ips list -a my-openclaw

# liberar IP públicas
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# cambiar a la configuración privada para que futuros despliegues no reasignen IP públicas
fly deploy -c deploy/fly.private.toml

# asignar IPv6 solo privada
fly ips allocate-v6 --private -a my-openclaw
```

Después de esto, `fly ips list` debería mostrar solo una IP de tipo `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Acceder a un despliegue privado

**Opción 1: proxy local (la más sencilla)**

```bash
fly proxy 3000:3000 -a my-openclaw
# open http://localhost:3000 in a browser
```

**Opción 2: VPN WireGuard**

```bash
fly wireguard create
# import to a WireGuard client, then access via internal IPv6
# example: http://[fdaa:x:x:x:x::x]:3000
```

**Opción 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks con despliegue privado

Para callbacks de Webhook (Twilio, Telnyx, etc.) sin exposición pública:

1. **Túnel ngrok**: ejecuta ngrok dentro del contenedor o como sidecar
2. **Tailscale Funnel**: expón rutas específicas mediante Tailscale
3. **Solo saliente**: algunos proveedores (Twilio) funcionan para llamadas salientes sin Webhooks

Ejemplo de configuración de llamadas de voz con ngrok, bajo `plugins.entries.voice-call.config`:

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

El túnel ngrok se ejecuta dentro del contenedor y proporciona una URL pública de Webhook sin exponer la propia aplicación de Fly. Define `webhookSecurity.allowedHosts` con el nombre de host del túnel para que se acepten los encabezados de host reenviados.

### Compensaciones de seguridad

| Aspecto             | Público       | Privado       |
| ------------------- | ------------- | ------------- |
| Escáneres de Internet | Detectable   | Oculto        |
| Ataques directos    | Posibles      | Bloqueados    |
| Acceso a la IU de control | Navegador | Proxy/VPN     |
| Entrega de Webhook  | Directa       | Mediante túnel |

## Notas

- Fly.io usa arquitectura x86; el Dockerfile es compatible tanto con x86 como con ARM.
- Para la incorporación de WhatsApp/Telegram, usa `fly ssh console`.
- Los datos persistentes residen en el volumen en `/data`.
- Signal requiere signal-cli (una CLI basada en Java) en la imagen; usa una imagen personalizada y mantén la memoria en 2 GB o más.

## Costo

Con la configuración recomendada (`shared-cpu-2x`, 2 GB de RAM), espera aproximadamente entre 10 y 15 USD al mes, según el uso; el nivel gratuito cubre cierta asignación básica. Consulta los [precios de Fly.io](https://fly.io/docs/about/pricing/) para ver las tarifas actuales.

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)

## Relacionado

- [Resumen de instalación](/es/install)
- [Hetzner](/es/install/hetzner)
- [Docker](/es/install/docker)
- [Alojamiento VPS](/es/vps)
