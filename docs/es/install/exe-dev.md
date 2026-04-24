---
read_when:
    - Quieres un host Linux económico y siempre activo para el Gateway
    - Quieres acceso remoto a la UI de control sin ejecutar tu propio VPS
summary: Ejecutar OpenClaw Gateway en exe.dev (VM + proxy HTTPS) para acceso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T05:34:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Objetivo: OpenClaw Gateway ejecutándose en una VM de exe.dev, accesible desde tu portátil mediante: `https://<vm-name>.exe.xyz`

Esta página asume la imagen predeterminada **exeuntu** de exe.dev. Si elegiste otra distribución, adapta los paquetes en consecuencia.

## Ruta rápida para principiantes

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Rellena tu clave/token de autenticación según sea necesario
3. Haz clic en "Agent" junto a tu VM y espera a que Shelley termine el aprovisionamiento
4. Abre `https://<vm-name>.exe.xyz/` y autentícate con el secreto compartido configurado (esta guía usa autenticación por token de forma predeterminada, pero la autenticación por contraseña también funciona si cambias `gateway.auth.mode`)
5. Aprueba cualquier solicitud pendiente de vinculación de dispositivos con `openclaw devices approve <requestId>`

## Lo que necesitas

- Cuenta de exe.dev
- Acceso `ssh exe.dev` a las máquinas virtuales de [exe.dev](https://exe.dev) (opcional)

## Instalación automatizada con Shelley

Shelley, el agente de [exe.dev](https://exe.dev), puede instalar OpenClaw al instante con nuestro
prompt. El prompt usado es el siguiente:

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalación manual

## 1) Crear la VM

Desde tu dispositivo:

```bash
ssh exe.dev new
```

Luego conéctate:

```bash
ssh <vm-name>.exe.xyz
```

Consejo: mantén esta VM **con estado**. OpenClaw almacena `openclaw.json`, `auth-profiles.json`
por agente, sesiones y estado de canales/proveedores en
`~/.openclaw/`, además del espacio de trabajo en `~/.openclaw/workspace/`.

## 2) Instalar requisitos previos (en la VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Instalar OpenClaw

Ejecuta el script de instalación de OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configurar nginx para hacer proxy de OpenClaw al puerto 8000

Edita `/etc/nginx/sites-enabled/default` con:

```text
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
OpenClaw solo confía en los metadatos de IP reenviada de proxies configurados explícitamente,
y las cadenas de estilo append en `X-Forwarded-For` se consideran un riesgo de refuerzo.

## 5) Acceder a OpenClaw y conceder privilegios

Accede a `https://<vm-name>.exe.xyz/` (consulta la salida de la UI de control del asistente de incorporación). Si solicita autenticación, pega el
secreto compartido configurado desde la VM. Esta guía usa autenticación por token, así que recupera `gateway.auth.token`
con `openclaw config get gateway.auth.token` (o genera uno con `openclaw doctor --generate-gateway-token`).
Si cambiaste el gateway a autenticación por contraseña, usa `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` en su lugar.
Aprueba dispositivos con `openclaw devices list` y `openclaw devices approve <requestId>`. Si tienes dudas, usa Shelley desde tu navegador.

## Acceso remoto

El acceso remoto se gestiona mediante la autenticación de [exe.dev](https://exe.dev). De
forma predeterminada, el tráfico HTTP del puerto 8000 se reenvía a `https://<vm-name>.exe.xyz`
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
