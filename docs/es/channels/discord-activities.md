---
read_when:
    - Configurar o solucionar problemas de los widgets de actividad de Discord
summary: Inicia widgets HTML autónomos de OpenClaw dentro de las Actividades de Discord
title: Actividades de Discord
x-i18n:
    generated_at: "2026-07-19T01:45:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b1bc04443aef89fd514290c3bebdbdd3e9972298b45cae3806bec99344f6d8cd
    source_path: channels/discord-activities.md
    workflow: 16
---

Las Actividades de Discord permiten que un agente publique un widget HTML interactivo y autónomo en el canal de Discord actual. El mensaje incluye un botón **Open widget**; al hacer clic, el widget se abre dentro de Discord.

La función está desactivada de forma predeterminada. OpenClaw registra las rutas HTTP de la Actividad, la herramienta del agente `show_widget` y el controlador del botón de apertura solo cuando `channels.discord.activities` está presente y se puede resolver un secreto de cliente. El alias obsoleto `discord_widget` seguirá disponible durante una versión.

## Requisitos previos

- un [bot de Discord de OpenClaw](/es/channels/discord) existente
- un nombre de host HTTPS público que llegue al Gateway de OpenClaw
- permiso para configurar Actividades y OAuth2 para la aplicación de Discord del bot

Cualquier proxy inverso o túnel HTTPS sirve. Un túnel de Cloudflare con nombre proporciona un nombre de host estable sin exponer directamente el puerto del Gateway.

```yaml
# ~/.cloudflared/config.yml
tunnel: openclaw-discord
credentials-file: /home/you/.cloudflared/TUNNEL-ID.json
ingress:
  - hostname: openclaw.example.com
    service: http://127.0.0.1:18789
  - service: http_status:404
```

```bash
cloudflared tunnel login
cloudflared tunnel create openclaw-discord
cloudflared tunnel route dns openclaw-discord openclaw.example.com
cloudflared tunnel run openclaw-discord
```

Mantenga habilitada la autenticación normal del Gateway. Solo el prefijo de la Actividad es público, y el propio plugin valida OAuth, la pertenencia a la instancia de la Actividad, la vinculación del canal, las sesiones y las capacidades de documento de un solo uso.

## Configuración

<Steps>
  <Step title="Exponer el Gateway mediante HTTPS">
    Inicie el túnel o proxy inverso y compruebe que `https://openclaw.example.com/discord/activity/` llega al Gateway después de añadir la configuración de Actividades. Sustituya el nombre de host de ejemplo por el suyo.
  </Step>

  <Step title="Habilitar Actividades en Discord">
    Abra la aplicación del bot existente en el [Portal para desarrolladores de Discord](https://discord.com/developers/applications). Abra **Activities**, habilite las Actividades y cree una asignación de URL:

    - prefijo: `ROOT` (`/`)
    - destino: `openclaw.example.com/discord/activity`

    El destino es el nombre de host público seguido de `/discord/activity`, sin una barra final.

  </Step>

  <Step title="Copiar el secreto de cliente de OAuth2">
    Abra **OAuth2** en el Portal para desarrolladores. Discord requiere al menos un URI de redirección, por lo que debe añadir un marcador de posición local, como la dirección de bucle invertido, si la aplicación aún no tiene ninguno; el SDK de aplicaciones integradas gestiona el flujo de retorno de la Actividad. Copie o restablezca el secreto de cliente de la aplicación. Trátelo como una credencial: no lo pegue en chats, registros ni archivos de configuración confirmados en el repositorio.
  </Step>

  <Step title="Configurar OpenClaw">
    Añada un bloque a la cuenta de Discord que deba ofrecer widgets:

    ```json5
    {
      channels: {
        discord: {
          token: "${DISCORD_BOT_TOKEN}",
          activities: {
            clientSecret: "${DISCORD_CLIENT_SECRET}",
            // Opcional. El valor predeterminado es el ID de la aplicación del bot obtenido al iniciar.
            applicationId: "YOUR_DISCORD_APPLICATION_ID",
          },
        },
      },
    }
    ```

    Puede omitir `clientSecret` del bloque cuando `DISCORD_CLIENT_SECRET` esté configurado. El bloque debe seguir presente para habilitar la función.

    La configuración normal de acceso de Discord permanece separada. Por ejemplo, `allowFrom` sigue controlando quién puede enviar mensajes directos al agente; no controla quién puede abrir un widget ya publicado en un canal.

  </Step>

  <Step title="Reiniciar y probar">
    Reinicie el Gateway. En una conversación de Discord, pida al agente que muestre un widget interactivo. El agente llama a `show_widget`; haga clic en **Open widget** en el mensaje publicado.
  </Step>
</Steps>

## Modelo de seguridad

- OAuth identifica al usuario de Discord antes de devolver los metadatos del widget.
- La API Get Activity Instance de Discord debe confirmar que el usuario de OAuth está presente en la instancia actual de la Actividad. El canal de la instancia debe coincidir con el canal donde se publicó el widget.
- Todas las personas a las que Discord permita acceder a ese canal pueden abrir sus widgets. Para limitar la audiencia, utilice los permisos de canal de Discord. Las listas de permitidos de comandos y mensajes directos de OpenClaw no conceden ni revocan el acceso al contenido ya publicado en el canal.
- Las sesiones de OAuth caducan después de 15 minutos. Las capacidades de documento del widget caducan después de 60 segundos y funcionan una sola vez.
- Los widgets caducan después de siete días y se conservan como máximo 64 por instancia del plugin de Discord.
- El HTML del widget lo crea el agente y debe tratarse como contenido de confianza. No incluya secretos que no querría que un widget defectuoso expusiera.
- El widget puede navegar dentro de su propio marco anidado. El iframe `sandbox="allow-scripts"` bloquea la navegación de nivel superior, las ventanas emergentes y el acceso al mismo origen, mientras que su Política de seguridad de contenido bloquea las conexiones de red y los recursos externos. Estos controles constituyen una defensa en profundidad, no un límite de seguridad frente al agente que creó el widget.
- Cuando las Actividades están deshabilitadas, `/discord/activity` no se registra en absoluto.

El contenedor público de la Actividad y la ruta de intercambio de tokens pasan a ser accesibles a través del túnel cuando se habilitan. No exponen el HTML del widget sin una sesión de OAuth válida y una capacidad de documento de un solo uso.

## Solución de problemas

### La Actividad indica “Gateway offline”

- confirme que el túnel está en ejecución y dirige el tráfico al puerto de enlace real del Gateway
- confirme que el destino del Portal para desarrolladores incluye `/discord/activity`
- reinicie el Gateway después de cambiar la configuración de Discord u OpenClaw
- revise los registros del Gateway para detectar la advertencia de una línea sobre la ausencia del secreto de cliente de Actividades

### Discord abre una página en blanco o informa de `blocked:csp`

- compruebe que la asignación de URL utiliza `ROOT` y no añade un segundo segmento `/discord/activity`
- confirme que el contenedor, `shell.js` y el módulo del SDK se devuelven correctamente a través del proxy de Discord
- inspeccione los registros del Gateway para buscar solicitudes bajo `/discord/activity/`

Las solicitudes de red de los widgets se bloquean intencionadamente. Incluya en línea todo el CSS, JavaScript, las imágenes y los datos que necesite el widget.

### “Widget unavailable”

Abra el botón desde el canal donde el agente lo publicó. OpenClaw registra las aperturas en el servidor cuando se hace clic, por lo que un registro de apertura reciente puede resolver el widget exacto incluso cuando Discord omite o altera el ID personalizado del botón. Cuando ni el ID personalizado ni un registro de apertura permiten resolverlo, OpenClaw abre el widget activo publicado más recientemente en ese canal. Los widgets anteriores siguen siendo accesibles mediante los botones que conservan su ID personalizado.

### “You cannot launch Activities in this channel”

Discord no abre Actividades desde hilos de publicaciones de foros. OpenClaw puede publicar allí el mensaje y el botón del widget, pero la Actividad debe abrirse desde un canal de texto normal. Esta restricción procede de Discord, no de OpenClaw.
