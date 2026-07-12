---
read_when:
    - Quieres un host Linux económico y siempre activo para el Gateway
    - Quieres acceder de forma remota a la interfaz de control sin ejecutar tu propio VPS.
summary: Ejecuta OpenClaw Gateway en exe.dev (máquina virtual + proxy HTTPS) para el acceso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-07-11T23:12:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Objetivo:** Gateway de OpenClaw ejecutándose en una máquina virtual de [exe.dev](https://exe.dev), accesible en `https://<vm-name>.exe.xyz`.

Esta guía presupone el uso de la imagen predeterminada **exeuntu** de exe.dev. Adapte los paquetes según corresponda en otras distribuciones.

## Qué necesita

- Una cuenta de exe.dev
- Acceso mediante `ssh exe.dev` a las máquinas virtuales de exe.dev (opcional, para la configuración manual)

## Ruta rápida para principiantes

1. Abra [https://exe.new/openclaw](https://exe.new/openclaw)
2. Introduzca su clave o token de autenticación según sea necesario
3. Haga clic en "Agent" junto a su máquina virtual y espere a que Shelley termine el aprovisionamiento
4. Abra `https://<vm-name>.exe.xyz/` y autentíquese con el secreto compartido configurado (autenticación mediante token de forma predeterminada; la autenticación mediante contraseña también funciona si cambia `gateway.auth.mode`)
5. Apruebe las solicitudes pendientes de emparejamiento de dispositivos con `openclaw devices approve <requestId>`

## Instalación automatizada con Shelley

Shelley, el agente de exe.dev, puede instalar OpenClaw a partir de una instrucción:

```text
Configura OpenClaw (https://docs.openclaw.ai/install) en esta máquina virtual. Usa las opciones de modo no interactivo y aceptación de riesgos para la incorporación de OpenClaw. Añade la autenticación o el token proporcionados según sea necesario. Configura nginx para reenviar desde el puerto predeterminado 18789 a la ubicación raíz de la configuración predeterminada habilitada del sitio y asegúrate de habilitar la compatibilidad con WebSocket. El emparejamiento se realiza con "openclaw devices list" y "openclaw devices approve <request id>". Asegúrate de que el panel muestre que el estado de OpenClaw es correcto. exe.dev se encarga del reenvío del puerto 8000 a los puertos 80/443 y de HTTPS, por lo que la dirección final accesible debe ser <vm-name>.exe.xyz, sin especificar ningún puerto.
```

## Instalación manual

<Steps>
  <Step title="Crear la máquina virtual">
    Desde su dispositivo:

    ```bash
    ssh exe.dev new
    ```

    A continuación, conéctese:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Mantenga esta máquina virtual **con estado persistente**. OpenClaw almacena `openclaw.json`, los archivos `auth-profiles.json` de cada agente, las sesiones y el estado de canales/proveedores en `~/.openclaw/`, además del espacio de trabajo en `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Instalar los requisitos previos (en la máquina virtual)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Instalar OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Configurar nginx como proxy hacia el puerto 8000">
    Edite `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # Compatibilidad con WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Encabezados de proxy estándar
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Configuración de tiempos de espera para conexiones de larga duración
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Sobrescriba los encabezados de reenvío en lugar de conservar las cadenas proporcionadas por el cliente. OpenClaw solo confía en los metadatos de IP reenviados por proxies configurados explícitamente, y las cadenas `X-Forwarded-For` que agregan valores se consideran un riesgo de seguridad.

  </Step>

  <Step title="Acceder a OpenClaw y aprobar dispositivos">
    Abra `https://<vm-name>.exe.xyz/` (consulte la salida de la interfaz de control durante la incorporación). Si solicita autenticación, pegue el secreto compartido configurado en la máquina virtual.

    Esta guía utiliza de forma predeterminada la autenticación mediante token, por lo que debe obtener `gateway.auth.token` con `openclaw config get gateway.auth.token` o generar uno nuevo con `openclaw doctor --n`. Si cambió el Gateway para usar autenticación mediante contraseña, utilice `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` en su lugar.

    Apruebe los dispositivos con `openclaw devices list` y `openclaw devices approve <requestId>`. En caso de duda, utilice Shelley desde el navegador.

  </Step>
</Steps>

## Configuración remota de canales

Para hosts remotos, es preferible realizar una sola llamada a `config patch` en lugar de muchas llamadas SSH a `config set`. Mantenga los tokens reales en el entorno de la máquina virtual o en `~/.openclaw/.env`, y coloque únicamente referencias SecretRef en `openclaw.json`. Consulte [Gestión de secretos](/es/gateway/secrets) para conocer el contrato completo de SecretRef.

En la máquina virtual, haga que el entorno del servicio contenga los secretos necesarios:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Desde su máquina local, cree un archivo de parche y canalícelo a la máquina virtual:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Utilice `--replace-path` cuando una lista de permitidos anidada deba coincidir exactamente con el valor del parche; por ejemplo, al reemplazar la lista de permitidos de un canal de Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Consulte [Discord](/es/channels/discord) y [Slack](/es/channels/slack) para obtener la referencia completa de configuración de los canales.

## Acceso remoto

exe.dev gestiona la autenticación para el acceso remoto. De forma predeterminada, el tráfico HTTP del puerto 8000 se reenvía a `https://<vm-name>.exe.xyz` con autenticación mediante correo electrónico.

## Actualización

```bash
openclaw update
```

Consulte [Actualización](/es/install/updating) para obtener información sobre los cambios de canal y la recuperación manual.

## Temas relacionados

- [Gateway remoto](/es/gateway/remote)
- [Descripción general de la instalación](/es/install)
