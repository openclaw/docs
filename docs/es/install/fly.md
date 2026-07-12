---
read_when:
    - Desplegar OpenClaw en Fly.io
    - Configuración de volúmenes, secretos y configuración inicial de Fly
summary: Implementación paso a paso de OpenClaw en Fly.io con almacenamiento persistente y HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-11T23:10:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Objetivo:** Gateway de OpenClaw ejecutándose en una máquina de [Fly.io](https://fly.io) con almacenamiento persistente, HTTPS automático y acceso a Discord/canales.

## Qué necesitas

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Cuenta de Fly.io (el nivel gratuito es suficiente)
- Autenticación del modelo: clave de API del proveedor de modelos elegido
- Credenciales del canal: token del bot de Discord, token de Telegram, etc.

## Ruta rápida para principiantes

1. Clona el repositorio y personaliza `fly.toml`
2. Crea la aplicación y el volumen, y configura los secretos
3. Despliega con `fly deploy`
4. Accede mediante SSH para crear la configuración o utiliza la interfaz de control

<Steps>
  <Step title="Crear la aplicación de Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # elige tu propio nombre
    fly apps create my-openclaw

    # normalmente, 1 GB es suficiente
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Elige una región cercana. Opciones habituales: `lhr` (Londres), `iad` (Virginia), `sjc` (San José).

  </Step>

  <Step title="Configurar fly.toml">
    Edita `fly.toml` para que coincida con el nombre y los requisitos de tu aplicación. El archivo `fly.toml` versionado en el repositorio es la plantilla pública que se muestra a continuación; `deploy/fly.private.toml` es la variante reforzada sin IP pública (consulta [Despliegue privado](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # nombre de tu aplicación
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

    El punto de entrada de la imagen de Docker de OpenClaw es `tini`, que ejecuta `node openclaw.mjs gateway` de forma predeterminada. `[processes]` de Fly reemplaza el `CMD` de Docker (aquí ejecuta directamente `node dist/index.js gateway ...`, el mismo punto de entrada compilado) sin modificar `ENTRYPOINT`, por lo que el proceso sigue ejecutándose mediante `tini`.

    **Configuración clave:**

    | Ajuste                         | Motivo                                                                              |
    | ------------------------------ | ----------------------------------------------------------------------------------- |
    | `--bind lan`                   | Enlaza con `0.0.0.0` para que el proxy de Fly pueda acceder al Gateway              |
    | `--allow-unconfigured`         | Inicia sin un archivo de configuración (lo crearás después)                         |
    | `internal_port = 3000`         | Debe coincidir con `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) para las comprobaciones de estado de Fly |
    | `memory = "2048mb"`            | 512 MB es insuficiente; se recomiendan 2 GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Conserva el estado en el volumen                                                    |

  </Step>

  <Step title="Configurar los secretos">
    ```bash
    # obligatorio: token de autenticación del Gateway para enlaces que no sean local loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # claves de API de los proveedores de modelos
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # opcional: otros proveedores
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # tokens de los canales
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Los enlaces que no sean local loopback (`--bind lan`) requieren una ruta válida de autenticación del Gateway. Este ejemplo utiliza `OPENCLAW_GATEWAY_TOKEN`, pero `gateway.auth.password` o un despliegue con proxy de confianza que no sea local loopback y esté configurado correctamente también cumplen el requisito. Consulta [Gestión de secretos](/es/gateway/secrets) para conocer el contrato de SecretRef.

    Trata estos tokens como contraseñas. Para las claves de API y los tokens, prefiere las variables de entorno/`fly secrets` al archivo de configuración, de modo que los secretos no se incluyan en `openclaw.json`.

  </Step>

  <Step title="Desplegar">
    ```bash
    fly deploy
    ```

    El primer despliegue compila la imagen de Docker. Comprueba el estado después del despliegue:

    ```bash
    fly status
    fly logs
    ```

    Al iniciarse, el Gateway registra `gateway ready` cuando el agente de escucha HTTP/WebSocket está activo. La comprobación de estado propia de Fly supervisa `internal_port = 3000` según `fly.toml`; además, la directiva `HEALTHCHECK` de Docker de la imagen consulta periódicamente `/healthz` en su puerto predeterminado 18789, que aquí no se utiliza porque este despliegue sobrescribe el puerto del Gateway con `--port 3000`.

  </Step>

  <Step title="Crear el archivo de configuración">
    Accede a la máquina mediante SSH para crear una configuración adecuada:

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

    Reemplaza `https://my-openclaw.fly.dev` por el origen real de tu aplicación de Fly. Al iniciarse, el Gateway añade los orígenes locales de la interfaz de control a partir de los valores de `--bind` y `--port` en tiempo de ejecución, de modo que el primer arranque pueda continuar antes de que exista la configuración; sin embargo, para acceder desde el navegador a través de Fly, el origen HTTPS exacto debe figurar en `gateway.controlUi.allowedOrigins`.

    El token de Discord puede proceder de cualquiera de estas fuentes:

    - Variable de entorno `DISCORD_BOT_TOKEN` (recomendada para secretos); no es necesario añadirla a la configuración, ya que el Gateway la lee automáticamente
    - Archivo de configuración `channels.discord.token`

    Reinicia para aplicar los cambios:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acceder al Gateway">
    ### Interfaz de control

    ```bash
    fly open
    ```

    O visita `https://my-openclaw.fly.dev/`.

    Autentícate con el secreto compartido configurado: el token del Gateway de `OPENCLAW_GATEWAY_TOKEN` o tu contraseña si cambiaste a la autenticación mediante contraseña.

    ### Registros

    ```bash
    fly logs              # registros en tiempo real
    fly logs --no-tail    # registros recientes
    ```

    ### Consola SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Solución de problemas

### "La aplicación no está escuchando en la dirección esperada"

El Gateway está enlazando con `127.0.0.1` en lugar de `0.0.0.0`.

**Solución:** añade `--bind lan` al comando del proceso en `fly.toml`.

### Fallan las comprobaciones de estado o se rechaza la conexión

Fly no puede acceder al Gateway en el puerto configurado.

**Solución:** asegúrate de que `internal_port` coincida con el puerto del Gateway (`--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### Problemas de memoria o falta de memoria

El contenedor se reinicia continuamente o el sistema lo termina. Indicadores: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o reinicios silenciosos.

**Solución:** aumenta la memoria en `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

O actualiza una máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB es insuficiente. 1 GB puede funcionar, pero podría agotarse la memoria bajo carga o con registros detallados. Se recomiendan 2 GB.

### Problemas con el bloqueo del Gateway

El Gateway se niega a iniciarse y muestra errores de tipo "ya está en ejecución" después de reiniciar un contenedor.

El archivo de bloqueo de instancia única se encuentra en `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (en Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), no en el volumen persistente `/data`, por lo que un reinicio completo del contenedor normalmente lo elimina junto con el resto del sistema de archivos del contenedor. Si el bloqueo persiste (por ejemplo, tras ejecutar `fly machine restart`, que conserva el sistema de archivos del contenedor) e impide el inicio, elimínalo manualmente:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### No se lee la configuración

`--allow-unconfigured` solo omite la protección de inicio. No crea ni repara `/data/openclaw.json`, así que asegúrate de que exista la configuración real y de que incluya `"gateway": { "mode": "local" }` para iniciar normalmente un Gateway local.

Comprueba que exista la configuración:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Escribir la configuración mediante SSH

`fly ssh console -C` no admite la redirección del shell. Para escribir un archivo de configuración:

```bash
# echo + tee (canalización del equipo local al remoto)
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

Si pierdes los perfiles de autenticación, el estado de los canales/proveedores o las sesiones después de un reinicio, el directorio de estado se está escribiendo en el sistema de archivos del contenedor en lugar de en el volumen.

**Solución:** asegúrate de que `OPENCLAW_STATE_DIR=/data` esté configurado en `fly.toml` y vuelve a desplegar.

## Actualización

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` es la ruta supervisada en este caso: recompila la imagen a partir del Dockerfile, por lo que la versión de la CLI/del Gateway, la imagen base del sistema operativo y cualquier cambio en el Dockerfile se actualizan conjuntamente. Ejecutar `openclaw update` dentro del contenedor en ejecución no es la misma operación, ya que la imagen se distribuye como un árbol `dist/` compilado con Docker, sin un checkout de `.git` ni una instalación global administrada por npm que pueda detectar; consulta [Actualización](/es/install/updating) para conocer ese flujo en instalaciones de tipo máquina virtual.

### Actualizar el comando de la máquina

Para cambiar el comando de inicio sin realizar un despliegue completo:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# o con un aumento de memoria
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Un `fly deploy` posterior restablece el comando de la máquina al valor definido en `fly.toml`; vuelve a aplicar los cambios manuales después de desplegar de nuevo.

## Despliegue privado (reforzado)

De forma predeterminada, Fly asigna direcciones IP públicas, por lo que tu Gateway queda accesible en `https://your-app.fly.dev` y puede ser detectado por escáneres de Internet (Shodan, Censys, etc.).

Utiliza `deploy/fly.private.toml` para realizar un despliegue reforzado **sin IP pública**: omite `[http_service]`, por lo que no se asigna ningún acceso público entrante.

### Cuándo utilizar un despliegue privado

- Solo llamadas/mensajes salientes (sin Webhooks entrantes)
- Los túneles de ngrok o Tailscale gestionan las retrollamadas de los Webhooks
- Se accede al Gateway mediante SSH, un proxy o WireGuard en lugar de un navegador
- El despliegue debe permanecer oculto para los escáneres de Internet

### Configuración

```bash
fly deploy -c deploy/fly.private.toml
```

O convierte un despliegue existente:

```bash
# enumera las IP actuales
fly ips list -a my-openclaw

# libera las IP públicas
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# cambia a la configuración privada para que los despliegues futuros no vuelvan a asignar IP públicas
fly deploy -c deploy/fly.private.toml

# asigna una IPv6 exclusivamente privada
fly ips allocate-v6 --private -a my-openclaw
```

Después de esto, `fly ips list` debería mostrar solo una IP de tipo `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Acceso a un despliegue privado

**Opción 1: proxy local (la más sencilla)**

```bash
fly proxy 3000:3000 -a my-openclaw
# abrir http://localhost:3000 en un navegador
```

**Opción 2: VPN WireGuard**

```bash
fly wireguard create
# importar en un cliente de WireGuard y acceder mediante la dirección IPv6 interna
# ejemplo: http://[fdaa:x:x:x:x::x]:3000
```

**Opción 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks con un despliegue privado

Para las devoluciones de llamada de Webhook (Twilio, Telnyx, etc.) sin exposición pública:

1. **Túnel de ngrok**: ejecuta ngrok dentro del contenedor o como contenedor auxiliar
2. **Tailscale Funnel**: expón rutas específicas mediante Tailscale
3. **Solo salientes**: algunos proveedores (Twilio) permiten realizar llamadas salientes sin webhooks

Ejemplo de configuración de llamadas de voz con ngrok, en `plugins.entries.voice-call.config`:

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

El túnel de ngrok se ejecuta dentro del contenedor y proporciona una URL pública de Webhook sin exponer la propia aplicación de Fly. Establece `webhookSecurity.allowedHosts` en el nombre de host del túnel para que se acepten los encabezados de host reenviados.

### Consideraciones de seguridad

| Aspecto               | Público        | Privado        |
| --------------------- | -------------- | -------------- |
| Escáneres de Internet | Detectable     | Oculto         |
| Ataques directos      | Posibles       | Bloqueados     |
| Acceso a la IU de control | Navegador  | Proxy/VPN      |
| Entrega de webhooks   | Directa        | Mediante túnel |

## Notas

- Fly.io usa la arquitectura x86; el Dockerfile es compatible tanto con x86 como con ARM.
- Para la incorporación de WhatsApp/Telegram, usa `fly ssh console`.
- Los datos persistentes se almacenan en el volumen ubicado en `/data`.
- Signal requiere signal-cli (una CLI basada en Java) en la imagen; usa una imagen personalizada y mantén la memoria en 2 GB o más.

## Coste

Con la configuración recomendada (`shared-cpu-2x`, 2 GB de RAM), el coste estimado es de unos 10-15 USD al mes, según el uso; el nivel gratuito cubre parte de la asignación básica. Consulta los [precios de Fly.io](https://fly.io/docs/about/pricing/) para conocer las tarifas actuales.

## Siguientes pasos

- Configura los canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Hetzner](/es/install/hetzner)
- [Docker](/es/install/docker)
- [Alojamiento en VPS](/es/vps)
