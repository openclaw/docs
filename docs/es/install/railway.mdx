---
read_when:
    - Desplegar OpenClaw en Railway
    - Quieres un despliegue en la nube de un clic con Control UI basada en navegador
summary: Desplegar OpenClaw en Railway con una plantilla de un clic
title: Railway
x-i18n:
    generated_at: "2026-04-23T14:04:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
---

# Railway

Despliega OpenClaw en Railway con una plantilla de un clic y accede a él a través de la Control UI web.
Esta es la ruta más fácil de “sin terminal en el servidor”: Railway ejecuta el Gateway por ti.

## Lista rápida de comprobación (usuarios nuevos)

1. Haz clic en **Deploy on Railway** (abajo).
2. Añade un **Volume** montado en `/data`.
3. Establece las **Variables** requeridas (al menos `OPENCLAW_GATEWAY_PORT` y `OPENCLAW_GATEWAY_TOKEN`).
4. Habilita **HTTP Proxy** en el puerto `8080`.
5. Abre `https://<your-railway-domain>/openclaw` y conéctate usando el secreto compartido configurado. Esta plantilla usa `OPENCLAW_GATEWAY_TOKEN` de forma predeterminada; si lo sustituyes por autenticación con contraseña, usa esa contraseña en su lugar.

## Despliegue con un clic

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

Después del despliegue, encuentra tu URL pública en **Railway → tu servicio → Settings → Domains**.

Railway hará una de estas dos cosas:

- te dará un dominio generado (a menudo `https://<something>.up.railway.app`), o
- usará tu dominio personalizado si has añadido uno.

Luego abre:

- `https://<your-railway-domain>/openclaw` — Control UI

## Qué obtienes

- Gateway de OpenClaw alojado + Control UI
- Almacenamiento persistente mediante Railway Volume (`/data`) para que `openclaw.json`,
  `auth-profiles.json` por agente, el estado de canales/proveedores, las sesiones y el
  espacio de trabajo sobrevivan a los redespliegues

## Ajustes obligatorios de Railway

### Redes públicas

Habilita **HTTP Proxy** para el servicio.

- Puerto: `8080`

### Volume (obligatorio)

Adjunta un volumen montado en:

- `/data`

### Variables

Establece estas variables en el servicio:

- `OPENCLAW_GATEWAY_PORT=8080` (obligatorio: debe coincidir con el puerto de Redes públicas)
- `OPENCLAW_GATEWAY_TOKEN` (obligatorio; trátalo como un secreto de administrador)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (recomendado)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (recomendado)

## Conectar un canal

Usa la Control UI en `/openclaw` o ejecuta `openclaw onboard` mediante el shell de Railway para ver instrucciones de configuración de canales:

- [Telegram](/es/channels/telegram) (el más rápido: solo un token de bot)
- [Discord](/es/channels/discord)
- [Todos los canales](/es/channels)

## Copias de seguridad y migración

Exporta tu estado, configuración, perfiles de autenticación y espacio de trabajo:

```bash
openclaw backup create
```

Esto crea un archivo portátil de copia de seguridad con el estado de OpenClaw más cualquier
espacio de trabajo configurado. Consulta [Backup](/es/cli/backup) para más detalles.

## Siguientes pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)
