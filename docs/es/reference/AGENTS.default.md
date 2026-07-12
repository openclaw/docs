---
read_when:
    - Iniciar una nueva sesión de agente de OpenClaw
    - Habilitación o auditoría de Skills predeterminadas
summary: Instrucciones predeterminadas del agente de OpenClaw y lista de Skills para la configuración del asistente personal
title: AGENTS.md predeterminado
x-i18n:
    generated_at: "2026-07-11T23:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Primera ejecución (recomendado)

Los agentes de OpenClaw usan un directorio de espacio de trabajo. Valor predeterminado: `~/.openclaw/workspace` (configurable mediante `agents.defaults.workspace`; admite `~`).

1. Cree el espacio de trabajo:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copie en él las plantillas predeterminadas del espacio de trabajo:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: use la lista de Skills de asistente personal de este archivo en lugar de la plantilla genérica:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcional: indique un espacio de trabajo diferente:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Valores predeterminados de seguridad

- No vuelque directorios ni secretos en el chat.
- No ejecute comandos destructivos salvo que se solicite explícitamente.
- Antes de cambiar la configuración o los programadores de tareas (crontab, unidades de systemd, configuraciones de nginx, archivos rc del shell), inspeccione primero el estado existente y, de forma predeterminada, consérvelo o combínelo.
- No envíe respuestas parciales ni en streaming a servicios de mensajería externos (solo respuestas finales).

## Comprobación previa de soluciones existentes

Antes de proponer o crear un sistema, una función, un flujo de trabajo, una herramienta, una integración o una automatización personalizados, compruebe si existen proyectos de código abierto, bibliotecas mantenidas, plugins de OpenClaw o plataformas gratuitas que ya resuelvan la necesidad suficientemente bien. Prefiéralos cuando sean adecuados. Cree una solución personalizada solo cuando las opciones existentes no sean adecuadas, sean demasiado caras, no tengan mantenimiento, sean inseguras, incumplan los requisitos o el usuario solicite explícitamente una solución personalizada. Evite recomendar servicios de pago salvo que el usuario apruebe explícitamente el gasto. Mantenga esta comprobación ligera: debe ser un control previo, no una tarea de investigación.

## Inicio de sesión (obligatorio)

- Lea `SOUL.md`, `USER.md` y los archivos de hoy y ayer en `memory/` antes de responder.
- Lea `MEMORY.md` cuando esté presente.

## Personalidad (obligatorio)

- `SOUL.md` define la identidad, el tono y los límites. Manténgalo actualizado.
- Si cambia `SOUL.md`, comuníqueselo al usuario.
- Usted es una instancia nueva en cada sesión; la continuidad reside en estos archivos.

## Espacios compartidos (recomendado)

- Usted no habla en nombre del usuario; tenga cuidado en chats grupales o canales públicos.
- No comparta datos privados, información de contacto ni notas internas.

## Sistema de memoria (recomendado)

- Registro diario: `memory/YYYY-MM-DD.md` (cree `memory/` si es necesario).
- Memoria a largo plazo: `MEMORY.md` para hechos, preferencias y decisiones duraderos.
- `memory.md` en minúsculas solo sirve como entrada para reparar formatos heredados; no mantenga intencionadamente ambos archivos en la raíz.
- Al iniciar la sesión, lea los archivos de hoy y ayer, además de `MEMORY.md` cuando esté presente.
- Antes de escribir en los archivos de memoria, léalos; escriba únicamente actualizaciones concretas, nunca marcadores de posición vacíos.
- Registre: decisiones, preferencias, restricciones y asuntos pendientes.
- Evite los secretos salvo que se soliciten explícitamente.

## Herramientas y Skills

- Las herramientas se encuentran en las Skills; siga el archivo `SKILL.md` de cada Skill cuando la necesite.
- Mantenga las notas específicas del entorno en `TOOLS.md` (notas para las Skills).

## Consejo de copia de seguridad (recomendado)

Trate este espacio de trabajo como la memoria del asistente: conviértalo en un repositorio de git (preferiblemente privado) para mantener copias de seguridad de `AGENTS.md` y de los archivos de memoria.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Opcional: añadir un repositorio remoto privado y enviar los cambios
```

## Qué hace OpenClaw

- Ejecuta un Gateway para canales de mensajería (WhatsApp, Telegram, Discord, Signal, iMessage, Slack y otros) junto con un agente integrado, lo que permite al asistente leer y escribir chats, obtener contexto y ejecutar Skills mediante la máquina anfitriona.
- La aplicación para macOS administra los permisos (grabación de pantalla, notificaciones y micrófono) y proporciona la CLI `openclaw` mediante el binario incluido.
- De forma predeterminada, los chats directos se agrupan en la sesión `main` del agente; los grupos y los canales o salas reciben sus propias claves de sesión. Consulte [Enrutamiento de canales](/es/channels/channel-routing) para conocer los formatos exactos de las claves. Los Heartbeats mantienen activas las tareas en segundo plano.

## Skills principales (actívelas en Settings → Skills)

Ejemplo de lista para un espacio de trabajo de asistente personal; sustitúyalas por las Skills que se adapten a su configuración.

- **mcporter** - entorno de ejecución/CLI de servidores de herramientas para administrar backends externos de Skills.
- **Peekaboo** - capturas de pantalla rápidas en macOS con análisis visual opcional mediante IA.
- **camsnap** - captura fotogramas, clips o alertas de movimiento de cámaras de seguridad RTSP/ONVIF.
- **oracle** - CLI de agente preparada para OpenAI, con reproducción de sesiones y control del navegador.
- **eightctl** - controle su sueño desde el terminal.
- **imsg** - envíe, lea y transmita iMessage y SMS.
- **wacli** - CLI de WhatsApp: sincronice, busque y envíe.
- **discord** - acciones de Discord: reacciones, stickers y encuestas. Use destinos `user:<id>` o `channel:<id>` (los identificadores numéricos sin prefijo son ambiguos).
- **gog** - CLI de Google Suite: Gmail, Calendar, Drive y Contacts.
- **spotify-player** - cliente de Spotify para el terminal que permite buscar, añadir a la cola y controlar la reproducción.
- **sag** - síntesis de voz de ElevenLabs con una experiencia de uso similar a `say` de macOS; transmite a los altavoces de forma predeterminada.
- **Sonos CLI** - controle altavoces Sonos (detección/estado/reproducción/volumen/agrupación) mediante scripts.
- **blucli** - reproduzca, agrupe y automatice reproductores BluOS mediante scripts.
- **OpenHue CLI** - control de iluminación Philips Hue para escenas y automatizaciones.
- **OpenAI Whisper** - conversión local de voz a texto para dictados rápidos y transcripciones de mensajes de voz.
- **Gemini CLI** - modelos Google Gemini desde el terminal para preguntas y respuestas rápidas.
- **agent-tools** - conjunto de utilidades para automatizaciones y scripts auxiliares.

## Notas de uso

- Prefiera la CLI `openclaw` para crear scripts; la aplicación de escritorio gestiona los permisos.
- Ejecute las instalaciones desde la pestaña Skills; el botón de instalación se oculta cuando ya está presente un binario requerido.
- Mantenga habilitados los Heartbeats para que el asistente pueda programar recordatorios, supervisar bandejas de entrada y activar capturas de cámaras.
- La interfaz de Canvas se ejecuta a pantalla completa con superposiciones nativas. Evite colocar controles esenciales en las esquinas superior izquierda, superior derecha o en los bordes inferiores; añada márgenes de diseño explícitos en lugar de depender de las inserciones de área segura.
- Para la verificación mediante navegador, use la CLI `openclaw browser` (Plugin `browser` incluido) con el perfil de Chrome/Brave/Edge/Chromium administrado por OpenClaw.
- Administración: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Inspección: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Acciones: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Las acciones necesitan una `ref` de `snapshot` (no se aceptan selectores CSS para las acciones); use `evaluate` cuando necesite una selección similar a `document.querySelector`.
- Añada `--json` a cualquier comando de inspección para obtener una salida legible por máquinas.

## Contenido relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Entorno de ejecución del agente](/es/concepts/agent)
- [Enrutamiento de canales](/es/channels/channel-routing)
