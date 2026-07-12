---
read_when:
    - Implementación de OpenClaw en Railway
    - Quieres un despliegue en la nube con un solo clic y una interfaz de control basada en el navegador.
summary: Implementa OpenClaw en Railway con una plantilla de un solo clic
title: Railway
x-i18n:
    generated_at: "2026-07-11T23:13:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Implementa OpenClaw en Railway con una plantilla de un solo clic y accede a él mediante la interfaz web de control. Esta es la opción más sencilla «sin terminal en el servidor»: Railway ejecuta el Gateway por ti.

## Implementación con un solo clic

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Implementar en Railway
</a>

<Steps>
  <Step title="Implementar la plantilla">
    Haz clic en **Implementar en Railway** arriba.
  </Step>

<Step title="Añadir un volumen">
  Adjunta un volumen montado en `/data` (obligatorio para conservar el estado).
</Step>

  <Step title="Establecer las variables">
    Establece las **Variables** obligatorias en el servicio:

    - `OPENCLAW_GATEWAY_PORT=8080` (obligatoria; debe coincidir con el puerto de Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (obligatoria; trátala como un secreto de administrador)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (recomendada)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (recomendada)

  </Step>

<Step title="Habilitar las redes públicas">
  En **Public Networking**, habilita **HTTP Proxy** para el servicio en el puerto `8080`.
</Step>

  <Step title="Conectarse">
    Busca tu URL pública en **Railway -> your service -> Settings -> Domains**: puede ser un dominio generado (a menudo `https://<something>.up.railway.app`) o el dominio personalizado que hayas asociado.

    Abre `https://<your-railway-domain>/openclaw` y conéctate con el secreto compartido configurado. La plantilla usa `OPENCLAW_GATEWAY_TOKEN` de forma predeterminada; si lo sustituyes por autenticación mediante contraseña, utiliza esa contraseña.

  </Step>
</Steps>

## Qué obtienes

- Gateway de OpenClaw alojado e interfaz de control
- Almacenamiento persistente mediante el volumen de Railway (`/data`), de modo que `openclaw.json`, los archivos `auth-profiles.json` de cada agente, el estado de los canales y proveedores, las sesiones y el espacio de trabajo se conservan entre nuevas implementaciones

## Conectar un canal

Usa la interfaz de control en `/openclaw` o ejecuta `openclaw onboard` mediante el shell de Railway para obtener instrucciones de configuración de los canales:

- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram) (la opción más rápida: solo necesitas un token de bot)
- [Todos los canales](/es/channels)

## Copias de seguridad y migración

Exporta el estado, la configuración, los perfiles de autenticación y el espacio de trabajo:

```bash
openclaw backup create
```

Esto crea un archivo de copia de seguridad portátil con el estado de OpenClaw y cualquier espacio de trabajo configurado. Consulta [Copia de seguridad](/es/cli/backup) para obtener más información.

## Próximos pasos

- Configura los canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)
