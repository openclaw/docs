---
read_when:
    - Quieres un host Linux económico y siempre activo para el Gateway
    - Quieres acceso remoto a la interfaz de control sin ejecutar tu propio VPS
summary: Ejecuta OpenClaw Gateway en exe.dev (VM + proxy HTTPS) para acceso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-07-05T11:25:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86227ad592997b1c8af600fa6258f647bcfd16e03a4fe19b159d48d7bfe6c883
    source_path: install/exe-dev.md
    workflow: 16
---

**Objetivo:** OpenClaw Gateway ejecutándose en una VM de [exe.dev](https://exe.dev), accesible en `https://<vm-name>.exe.xyz`.

Esta guía asume la imagen **exeuntu** predeterminada de exe.dev. Adapta los paquetes según corresponda en otras distribuciones.

## Lo que necesitas

- Cuenta de exe.dev
- Acceso con `ssh exe.dev` a las VM de exe.dev (opcional, para configuración manual)

## Ruta rápida para principiantes

1. Abre [https://exe.new/openclaw](https://exe.new/openclaw)
2. Completa tu clave/token de autenticación según sea necesario
3. Haz clic en "Agent" junto a tu VM y espera a que Shelley termine el aprovisionamiento
4. Abre `https://<vm-name>.exe.xyz/` y autentícate con el secreto compartido configurado (autenticación por token de forma predeterminada; la autenticación por contraseña también funciona si cambias `gateway.auth.mode`)
5. Aprueba las solicitudes pendientes de emparejamiento de dispositivos con `openclaw devices approve <requestId>`

## Instalación automatizada con Shelley

Shelley, el agente de exe.dev, puede instalar OpenClaw desde una instrucción:

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalación manual

<Steps>
  <Step title="Crear la VM">
    Desde tu dispositivo:

    ```bash
    ssh exe.dev new
    ```

    Luego conéctate:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Mantén esta VM **con estado**. OpenClaw almacena `openclaw.json`, `auth-profiles.json` por agente, sesiones y estado de canales/proveedores en `~/.openclaw/`, además del espacio de trabajo en `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Instalar requisitos previos (en la VM)">
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

  <Step title="Configurar nginx para actuar como proxy al puerto 8000">
    Edita `/etc/nginx/sites-enabled/default`:

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

            # WebSocket support
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Standard proxy headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeout settings for long-lived connections
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Sobrescribe las cabeceras de reenvío en lugar de preservar cadenas proporcionadas por el cliente. OpenClaw confía en los metadatos de IP reenviada solo desde proxies configurados explícitamente, y las cadenas `X-Forwarded-For` de estilo anexado se tratan como un riesgo de endurecimiento.

  </Step>

  <Step title="Acceder a OpenClaw y aprobar dispositivos">
    Abre `https://<vm-name>.exe.xyz/` (consulta la salida de Control UI del onboarding). Si solicita autenticación, pega el secreto compartido configurado desde la VM.

    Esta guía usa autenticación por token de forma predeterminada, así que recupera `gateway.auth.token` con `openclaw config get gateway.auth.token`, o genera uno nuevo con `openclaw doctor --n`. Si cambiaste el Gateway a autenticación por contraseña, usa `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` en su lugar.

    Aprueba dispositivos con `openclaw devices list` y `openclaw devices approve <requestId>`. En caso de duda, usa Shelley desde tu navegador.

  </Step>
</Steps>

## Configuración de canales remotos

Para hosts remotos, prefiere una llamada `config patch` en lugar de muchas llamadas SSH a `config set`. Mantén los tokens reales en el entorno de la VM o en `~/.openclaw/.env`, y coloca solo SecretRefs en `openclaw.json`. Consulta [Gestión de secretos](/es/gateway/secrets) para ver el contrato completo de SecretRef.

En la VM, haz que el entorno del servicio contenga los secretos que necesita:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Desde tu máquina local, crea un archivo de parche y envíalo por tubería a la VM:

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
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

Usa `--replace-path` cuando una allowlist anidada deba convertirse exactamente en el valor del parche, por ejemplo al reemplazar una allowlist de canales de Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Consulta [Discord](/es/channels/discord) y [Slack](/es/channels/slack) para ver la referencia completa de configuración de canales.

## Acceso remoto

exe.dev gestiona la autenticación para el acceso remoto. De forma predeterminada, el tráfico HTTP del puerto 8000 se reenvía a `https://<vm-name>.exe.xyz` con autenticación por correo electrónico.

## Actualización

```bash
openclaw update
```

Consulta [Actualización](/es/install/updating) para cambios de canal y recuperación manual.

## Relacionado

- [Gateway remoto](/es/gateway/remote)
- [Descripción general de instalación](/es/install)
