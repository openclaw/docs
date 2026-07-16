---
read_when:
    - Implementación de OpenClaw en Fly.io
    - Configuración de volúmenes, secretos y configuración inicial de Fly
summary: Implementación paso a paso de OpenClaw en Fly.io con almacenamiento persistente y HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T11:42:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Objetivo:** Gateway de OpenClaw ejecutándose en una máquina de [Fly.io](https://fly.io) con almacenamiento persistente, HTTPS automático y acceso a Discord/canales.

## Qué se necesita

- [CLI de flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Cuenta de Fly.io (el nivel gratuito funciona)
- Autenticación del modelo: clave de API del proveedor de modelos elegido
- Credenciales del canal: token del bot de Discord, token de Telegram, etc.

## Ruta rápida para principiantes

1. Clonar el repositorio, personalizar `fly.toml`
2. Crear la aplicación y el volumen, configurar los secretos
3. Desplegar con `fly deploy`
4. Acceder mediante SSH para crear la configuración o usar la interfaz de control

<Steps>
  <Step title="Crear la aplicación de Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # elija su propio nombre
    fly apps create my-openclaw

    # 1 GB suele ser suficiente
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Elija una región cercana. Opciones habituales: `lhr` (Londres), `iad` (Virginia), `sjc` (San José).

  </Step>

  <Step title="Configurar fly.toml">
    Edite `fly.toml` para que coincida con el nombre y los requisitos de la aplicación. El archivo `fly.toml` incluido en el repositorio es la plantilla pública que se muestra a continuación; `deploy/fly.private.toml` es la variante reforzada sin IP pública (consulte [Despliegue privado](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # nombre de la aplicación
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

    El punto de entrada de la imagen de Docker de OpenClaw es `tini` y ejecuta `node openclaw.mjs gateway` de forma predeterminada. El `[processes]` de Fly sustituye el `CMD` de Docker (aquí ejecuta directamente `node dist/index.js gateway ...`, el mismo punto de entrada compilado) sin modificar `ENTRYPOINT`, por lo que el proceso continúa ejecutándose bajo `tini`.

    **Ajustes clave:**

    | Ajuste                         | Motivo                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Se vincula a `0.0.0.0` para que el proxy de Fly pueda acceder al Gateway       |
    | `--allow-unconfigured`         | Se inicia sin un archivo de configuración (se crea posteriormente)         |
    | `internal_port = 3000`         | Debe coincidir con `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) para las comprobaciones de estado de Fly |
    | `memory = "2048mb"`            | 512 MB es insuficiente; se recomiendan 2 GB                                 |
    | `OPENCLAW_STATE_DIR = "/data"` | Conserva el estado en el volumen                                             |

  </Step>

  <Step title="Configurar los secretos">
    ```bash
    # obligatorio: token de autenticación del Gateway para vinculaciones que no sean de bucle invertido
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # claves de API de los proveedores de modelos
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # opcional: otros proveedores
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # tokens de canales
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Las vinculaciones que no sean de bucle invertido (`--bind lan`) requieren una ruta válida de autenticación del Gateway. Este ejemplo utiliza `OPENCLAW_GATEWAY_TOKEN`, pero `gateway.auth.password` o un despliegue de proxy de confianza sin bucle invertido correctamente configurado también cumplen el requisito. Consulte [Gestión de secretos](/es/gateway/secrets) para conocer el contrato SecretRef.

    Trate estos tokens como contraseñas. Para las claves de API y los tokens, prefiera variables de entorno/`fly secrets` en lugar del archivo de configuración, de modo que los secretos no se incluyan en `openclaw.json`.

  </Step>

  <Step title="Desplegar">
    ```bash
    fly deploy
    ```

    El primer despliegue crea la imagen de Docker. Verifique el resultado después del despliegue:

    ```bash
    fly status
    fly logs
    ```

    Los registros de inicio del Gateway muestran `gateway ready` cuando el agente de escucha HTTP/WebSocket está en funcionamiento. La comprobación de estado propia de Fly supervisa `internal_port = 3000` según `fly.toml`; la directiva `HEALTHCHECK` de Docker de la imagen también consulta `/healthz` en su puerto predeterminado 18789, que no se utiliza aquí porque este despliegue configura el Gateway para usar `--port 3000`.

  </Step>

  <Step title="Crear el archivo de configuración">
    Acceda a la máquina mediante SSH para crear una configuración adecuada:

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

    Sustituya `https://my-openclaw.fly.dev` por el origen real de la aplicación de Fly. Al iniciarse, el Gateway obtiene los orígenes locales de la interfaz de control a partir de los valores `--bind` y `--port` del entorno de ejecución, por lo que el primer arranque puede continuar antes de que exista la configuración; sin embargo, el acceso desde el navegador a través de Fly sigue requiriendo que el origen HTTPS exacto figure en `gateway.controlUi.allowedOrigins`.

    El token de Discord puede proceder de cualquiera de estas fuentes:

    - Variable de entorno `DISCORD_BOT_TOKEN` (recomendada para secretos); no es necesario añadirla a la configuración, ya que el Gateway la lee automáticamente
    - Archivo de configuración `channels.discord.token`

    Reinicie para aplicar los cambios:

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

    O visite `https://my-openclaw.fly.dev/`.

    Autentíquese con el secreto compartido configurado: el token del Gateway de `OPENCLAW_GATEWAY_TOKEN` o la contraseña si se cambió a la autenticación mediante contraseña.

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

### "La aplicación no escucha en la dirección esperada"

El Gateway se vincula a `127.0.0.1` en lugar de `0.0.0.0`.

**Solución:** añada `--bind lan` al comando del proceso en `fly.toml`.

### Fallos en las comprobaciones de estado o conexión rechazada

Fly no puede acceder al Gateway en el puerto configurado.

**Solución:** asegúrese de que `internal_port` coincida con el puerto del Gateway (`--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### Problemas de OOM o memoria

El contenedor se reinicia continuamente o se termina. Señales: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o reinicios silenciosos.

**Solución:** aumente la memoria en `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

O actualice una máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB es insuficiente. 1 GB puede funcionar, pero puede quedarse sin memoria bajo carga o con un registro detallado. Se recomiendan 2 GB.

### Problemas con el bloqueo del Gateway

El Gateway se niega a iniciarse con errores de "ya está en ejecución" después de reiniciar un contenedor.

Los archivos de bloqueo del entorno de ejecución se encuentran en `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
y `gateway.state.<hash>.lock` (en Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), no en el volumen persistente `/data`, por lo que
un reinicio completo del contenedor normalmente los elimina junto con el resto del
sistema de archivos del contenedor. Si un bloqueo persiste (por ejemplo, un `fly machine restart`
que conserve el sistema de archivos del contenedor) e impide el inicio, elimínelo
manualmente:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### No se lee la configuración

`--allow-unconfigured` solo omite la protección de inicio. No crea ni repara `/data/openclaw.json`, así que asegúrese de que la configuración real exista e incluya `"gateway": { "mode": "local" }` para un inicio local normal del Gateway.

Verifique que la configuración exista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Escritura de la configuración mediante SSH

`fly ssh console -C` no admite la redirección del intérprete de comandos. Para escribir un archivo de configuración:

```bash
# echo + tee (canalización del sistema local al remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# o sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` puede fallar si el archivo ya existe; elimínelo primero:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### El estado no se conserva

Si se pierden los perfiles de autenticación, el estado de los canales/proveedores o las sesiones después de un reinicio, el directorio de estado está escribiendo en el sistema de archivos del contenedor en lugar del volumen.

**Solución:** asegúrese de que `OPENCLAW_STATE_DIR=/data` esté configurado en `fly.toml` y vuelva a desplegar.

## Actualización

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` es la ruta supervisada en este caso: vuelve a crear la imagen a partir del Dockerfile, por lo que la versión de la CLI/Gateway, la imagen base del sistema operativo y cualquier cambio en el Dockerfile se actualizan conjuntamente. Ejecutar `openclaw update` dentro del contenedor no es la misma operación, ya que la imagen se distribuye como un árbol `dist/` creado con Docker, sin una copia de trabajo `.git` ni una instalación global administrada por npm que pueda detectar; consulte [Actualización](/es/install/updating) para conocer ese flujo en instalaciones similares a una máquina virtual.

### Actualización del comando de la máquina

Para cambiar el comando de inicio sin volver a desplegar por completo:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# o con un aumento de memoria
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Un `fly deploy` posterior restablece el comando de la máquina al valor definido en `fly.toml`; vuelva a aplicar los cambios manuales después de volver a desplegar.

## Despliegue privado (reforzado)

De forma predeterminada, Fly asigna direcciones IP públicas, por lo que el Gateway queda accesible en `https://your-app.fly.dev` y puede ser descubierto por escáneres de Internet (Shodan, Censys, etc.).

Use `deploy/fly.private.toml` para realizar un despliegue reforzado **sin IP pública**: omite `[http_service]`, por lo que no se asigna ninguna entrada pública.

### Cuándo utilizar un despliegue privado

- Solo llamadas/mensajes salientes (sin Webhooks entrantes)
- Los túneles de ngrok o Tailscale gestionan las devoluciones de llamada de los Webhooks
- El acceso al Gateway se realiza mediante SSH, proxy o WireGuard en lugar de un navegador
- El despliegue debe permanecer oculto para los escáneres de Internet

### Configuración

```bash
fly deploy -c deploy/fly.private.toml
```

O convierta un despliegue existente:

```bash
# listar las IP actuales
fly ips list -a my-openclaw

# liberar las IP públicas
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# cambiar a la configuración privada para que los futuros despliegues no vuelvan a asignar IP públicas
fly deploy -c deploy/fly.private.toml

# asignar una IPv6 exclusivamente privada
fly ips allocate-v6 --private -a my-openclaw
```

Después de esto, `fly ips list` debería mostrar solo una IP de tipo `private`:

```text
VERSIÓN  IP                   TIPO             REGIÓN
v6       fdaa:x:x:x:x::x      privada          global
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
# importar en un cliente WireGuard y acceder mediante la IPv6 interna
# ejemplo: http://[fdaa:x:x:x:x::x]:3000
```

**Opción 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks con un despliegue privado

Para devoluciones de llamada de Webhook (Twilio, Telnyx, etc.) sin exposición pública:

1. **túnel ngrok**: ejecutar ngrok dentro del contenedor o como contenedor auxiliar
2. **Tailscale Funnel**: exponer rutas específicas mediante Tailscale
3. **Solo saliente**: algunos proveedores (Twilio) permiten llamadas salientes sin webhooks

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

El túnel ngrok se ejecuta dentro del contenedor y proporciona una URL pública de Webhook sin exponer la propia aplicación de Fly. Establezca `webhookSecurity.allowedHosts` en el nombre de host del túnel para que se acepten los encabezados de host reenviados.

### Consideraciones de seguridad

| Aspecto               | Público       | Privado          |
| --------------------- | ------------- | ---------------- |
| Escáneres de Internet | Detectable    | Oculto           |
| Ataques directos      | Posibles      | Bloqueados       |
| Acceso a la IU de control | Navegador | Proxy/VPN        |
| Entrega de Webhook    | Directa       | Mediante un túnel |

## Notas

- Fly.io utiliza arquitectura x86; el Dockerfile es compatible tanto con x86 como con ARM.
- Para la incorporación de WhatsApp/Telegram, utilice `fly ssh console`.
- Los datos persistentes se almacenan en el volumen ubicado en `/data`.
- Signal requiere signal-cli (una CLI basada en Java) en la imagen; utilice una imagen personalizada y mantenga la memoria en 2GB o más.

## Coste

Con la configuración recomendada (`shared-cpu-2x`, 2GB de RAM), el coste estimado es de aproximadamente $10-15/mes, según el uso; el nivel gratuito cubre parte de la asignación básica. Consulte los [precios de Fly.io](https://fly.io/docs/about/pricing/) para conocer las tarifas actuales.

## Siguientes pasos

- Configurar canales de mensajería: [Canales](/es/channels)
- Configurar el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantener OpenClaw actualizado: [Actualización](/es/install/updating)

## Relacionado

- [Descripción general de la instalación](/es/install)
- [Hetzner](/es/install/hetzner)
- [Docker](/es/install/docker)
- [Alojamiento en VPS](/es/vps)
