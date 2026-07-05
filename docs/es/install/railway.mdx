---
read_when:
    - Implementación de OpenClaw en Railway
    - Quieres una implementación en la nube con un clic y Control UI basado en navegador
summary: Despliega OpenClaw en Railway con una plantilla de un clic
title: Railway
x-i18n:
    generated_at: "2026-07-05T11:29:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Implementa OpenClaw en Railway con una plantilla de un clic y accede a él a través de la UI de control web. Esta es la ruta más sencilla "sin terminal en el servidor": Railway ejecuta el Gateway por ti.

## Implementación de un clic

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Implementar en Railway
</a>

<Steps>
  <Step title="Implementa la plantilla">
    Haz clic en **Implementar en Railway** arriba.
  </Step>

<Step title="Añade un volumen">
  Adjunta un volumen montado en `/data` (obligatorio para el estado persistente).
</Step>

  <Step title="Configura variables">
    Configura las **Variables** obligatorias en el servicio:

    - `OPENCLAW_GATEWAY_PORT=8080` (obligatorio -- debe coincidir con el puerto en redes públicas)
    - `OPENCLAW_GATEWAY_TOKEN` (obligatorio; trátalo como un secreto de administrador)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (recomendado)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (recomendado)

  </Step>

<Step title="Activa las redes públicas">
  En **Redes públicas**, activa **Proxy HTTP** para el servicio en el puerto `8080`.
</Step>

  <Step title="Conecta">
    Busca tu URL pública en **Railway -> tu servicio -> Configuración -> Dominios** -- ya sea un dominio generado (a menudo `https://<something>.up.railway.app`) o tu dominio personalizado adjunto.

    Abre `https://<your-railway-domain>/openclaw` y conéctate con el secreto compartido configurado. La plantilla usa `OPENCLAW_GATEWAY_TOKEN` de forma predeterminada; si lo reemplazas por autenticación con contraseña, usa esa contraseña en su lugar.

  </Step>
</Steps>

## Qué obtienes

- Gateway + UI de control de OpenClaw alojados
- Almacenamiento persistente mediante el volumen de Railway (`/data`), por lo que `openclaw.json`, los `auth-profiles.json` por agente, el estado de canales/proveedores, las sesiones y el espacio de trabajo sobreviven a nuevas implementaciones

## Conectar un canal

Usa la UI de control en `/openclaw` o ejecuta `openclaw onboard` mediante la shell de Railway para obtener instrucciones de configuración de canales:

- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram) (lo más rápido -- solo un token de bot)
- [Todos los canales](/es/channels)

## Copias de seguridad y migración

Exporta tu estado, configuración, perfiles de autenticación y espacio de trabajo:

```bash
openclaw backup create
```

Esto crea un archivo de copia de seguridad portable con el estado de OpenClaw más cualquier espacio de trabajo configurado. Consulta [Copia de seguridad](/es/cli/backup) para obtener más detalles.

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualizar](/es/install/updating)
