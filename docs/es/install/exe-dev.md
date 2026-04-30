---
read_when:
    - Quieres un host Linux económico y siempre activo para el Gateway
    - Quieres acceso remoto a la interfaz de Control sin tener que ejecutar tu propio VPS
summary: Ejecutar OpenClaw Gateway en exe.dev (VM + proxy HTTPS) para acceso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T05:47:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Objetivo: OpenClaw Gateway ejecutándose en una máquina virtual de exe.dev, accesible desde tu portátil mediante: `https://<vm-name>.exe.xyz`

Esta página presupone la imagen **exeuntu** predeterminada de exe.dev. Si elegiste una distribución distinta, adapta los paquetes según corresponda.

## Ruta rápida para principiantes

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Completa tu clave/token de autenticación según sea necesario
3. Haz clic en "Agent" junto a tu máquina virtual y espera a que Shelley termine el aprovisionamiento
4. Abre `https://<vm-name>.exe.xyz/` y autentícate con el secreto compartido configurado (esta guía usa autenticación por token de forma predeterminada, pero la autenticación por contraseña también funciona si cambias `gateway.auth.mode`)
5. Aprueba cualquier solicitud pendiente de emparejamiento de dispositivos con `openclaw devices approve <requestId>`

## Lo que necesitas

- Cuenta de exe.dev
- Acceso `ssh exe.dev` a máquinas virtuales de [exe.dev](https://exe.dev) (opcional)

## Instalación automatizada con Shelley

Shelley, el agente de [exe.dev](https://exe.dev), puede instalar OpenClaw al instante con nuestro
prompt. El prompt usado es el siguiente:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalación manual

## 1) Crea la máquina virtual

Desde tu dispositivo:

```bash
ssh exe.dev new
```

Luego conéctate:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Mantén esta máquina virtual **con estado**. OpenClaw almacena `openclaw.json`, archivos `auth-profiles.json` por agente, sesiones y estado de canales/proveedores en `~/.openclaw/`, además del área de trabajo en `~/.openclaw/workspace/`.
</Tip>

## 2) Instala los prerrequisitos (en la máquina virtual)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Instala OpenClaw

Ejecuta el script de instalación de OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configura nginx para usar proxy de OpenClaw al puerto 8000

Edita `/etc/nginx/sites-enabled/default` con

```
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

Sobrescribe los encabezados de reenvío en lugar de conservar cadenas proporcionadas por el cliente.
OpenClaw confía en los metadatos de IP reenviada solo desde proxies configurados explícitamente,
y las cadenas `X-Forwarded-For` de estilo anexado se tratan como un riesgo de endurecimiento.

## 5) Accede a OpenClaw y concede privilegios

Accede a `https://<vm-name>.exe.xyz/` (consulta la salida de la interfaz de control durante la incorporación). Si solicita autenticación, pega el
secreto compartido configurado desde la máquina virtual. Esta guía usa autenticación por token, así que recupera `gateway.auth.token`
con `openclaw config get gateway.auth.token` (o genera uno con `openclaw doctor --generate-gateway-token`).
Si cambiaste el gateway a autenticación por contraseña, usa `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` en su lugar.
Aprueba dispositivos con `openclaw devices list` y `openclaw devices approve <requestId>`. Si tienes dudas, usa Shelley desde tu navegador.

## Configuración remota de canales

Para hosts remotos, prefiere una llamada `config patch` en lugar de muchas llamadas SSH a `config set`. Mantén los tokens reales en el entorno de la máquina virtual o en `~/.openclaw/.env`, y coloca solo SecretRefs en `openclaw.json`.

En la máquina virtual, haz que el entorno del servicio contenga los secretos que necesita:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Desde tu máquina local, crea un archivo de parche y canalízalo a la máquina virtual:

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

Usa `--replace-path` cuando una lista de permitidos anidada deba convertirse exactamente en el valor del parche, por ejemplo al reemplazar una lista de permitidos de canales de Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Acceso remoto

El acceso remoto lo gestiona la autenticación de [exe.dev](https://exe.dev). De forma
predeterminada, el tráfico HTTP del puerto 8000 se reenvía a `https://<vm-name>.exe.xyz`
con autenticación por correo electrónico.

## Actualización

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Guía: [Actualización](/es/install/updating)

## Relacionado

- [Gateway remoto](/es/gateway/remote)
- [Resumen de instalación](/es/install)
