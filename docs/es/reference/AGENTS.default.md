---
read_when:
    - Iniciar una nueva sesión de agente de OpenClaw
    - Habilitar o auditar Skills predeterminadas
summary: Instrucciones de agente predeterminadas de OpenClaw y lista de Skills para la configuración del asistente personal
title: AGENTS.md predeterminado
x-i18n:
    generated_at: "2026-07-05T11:39:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Primera ejecución (recomendado)

Los agentes de OpenClaw usan un directorio de espacio de trabajo. Valor predeterminado: `~/.openclaw/workspace` (configurable mediante `agents.defaults.workspace`, admite `~`).

1. Crea el espacio de trabajo:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copia las plantillas predeterminadas del espacio de trabajo allí:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: usa la lista de Skills de asistente personal de este archivo en lugar de la plantilla genérica:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcional: apunta a otro espacio de trabajo:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Valores predeterminados de seguridad

- No vuelques directorios ni secretos en el chat.
- No ejecutes comandos destructivos salvo que se solicite explícitamente.
- Antes de cambiar configuraciones o programadores (crontab, unidades systemd, configuraciones de nginx, archivos rc del shell), inspecciona primero el estado existente y preserva/fusiona de forma predeterminada.
- No envíes respuestas parciales/en streaming a superficies de mensajería externas (solo respuestas finales).

## Comprobación previa de soluciones existentes

Antes de proponer o crear un sistema, función, flujo de trabajo, herramienta, integración o automatización personalizada, comprueba si hay proyectos de código abierto, bibliotecas mantenidas, Plugins de OpenClaw existentes o plataformas gratuitas que ya lo resuelvan suficientemente bien. Prefiérelos cuando sean adecuados. Crea algo personalizado solo cuando las opciones existentes sean inadecuadas, demasiado caras, no estén mantenidas, sean inseguras, no cumplan los requisitos o el usuario pida explícitamente algo personalizado. Evita recomendar servicios de pago salvo que el usuario apruebe explícitamente el gasto. Mantén esto ligero, como una puerta de comprobación previa, no como una tarea de investigación.

## Inicio de sesión (obligatorio)

- Lee `SOUL.md`, `USER.md` y hoy+ayer en `memory/` antes de responder.
- Lee `MEMORY.md` cuando esté presente.

## Soul (obligatorio)

- `SOUL.md` define identidad, tono y límites. Mantenlo actualizado.
- Si cambias `SOUL.md`, díselo al usuario.
- Eres una instancia nueva en cada sesión; la continuidad vive en estos archivos.

## Espacios compartidos (recomendado)

- No eres la voz del usuario; ten cuidado en chats grupales o canales públicos.
- No compartas datos privados, información de contacto ni notas internas.

## Sistema de memoria (recomendado)

- Registro diario: `memory/YYYY-MM-DD.md` (crea `memory/` si es necesario).
- Memoria a largo plazo: `MEMORY.md` para hechos, preferencias y decisiones duraderos.
- `memory.md` en minúsculas es solo entrada de reparación heredada; no mantengas ambos archivos raíz a propósito.
- Al iniciar la sesión, lee hoy + ayer + `MEMORY.md` cuando esté presente.
- Antes de escribir archivos de memoria, léelos primero; escribe solo actualizaciones concretas, nunca marcadores vacíos.
- Captura: decisiones, preferencias, restricciones, bucles abiertos.
- Evita secretos salvo que se solicite explícitamente.

## Herramientas y Skills

- Las herramientas viven en Skills; sigue el `SKILL.md` de cada Skill cuando lo necesites.
- Mantén notas específicas del entorno en `TOOLS.md` (notas para Skills).

## Consejo de copia de seguridad (recomendado)

Trata este espacio de trabajo como la memoria del asistente: conviértelo en un repositorio git (idealmente privado) para que `AGENTS.md` y los archivos de memoria tengan copia de seguridad.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Optional: add a private remote + push
```

## Qué hace OpenClaw

- Ejecuta un Gateway de canal de mensajería (WhatsApp, Telegram, Discord, Signal, iMessage, Slack y más) junto con un agente integrado, para que el asistente pueda leer/escribir chats, obtener contexto y ejecutar Skills mediante la máquina anfitriona.
- La app de macOS gestiona permisos (grabación de pantalla, notificaciones, micrófono) y expone la CLI `openclaw` mediante su binario incluido.
- Los chats directos se agrupan de forma predeterminada en la sesión `main` del agente; los grupos y canales/salas obtienen sus propias claves de sesión. Consulta [Enrutamiento de canales](/es/channels/channel-routing) para ver los formatos exactos de las claves. Los Heartbeats mantienen vivas las tareas en segundo plano.

## Skills principales (habilitar en Configuración → Skills)

Lista de ejemplo para un espacio de trabajo de asistente personal; sustituye por las Skills que encajen con tu configuración.

- **mcporter** - runtime/CLI de servidor de herramientas para gestionar backends externos de Skills.
- **Peekaboo** - capturas de pantalla rápidas de macOS con análisis opcional de visión por IA.
- **camsnap** - captura fotogramas, clips o alertas de movimiento desde cámaras de seguridad RTSP/ONVIF.
- **oracle** - CLI de agente preparada para OpenAI con reproducción de sesión y control del navegador.
- **eightctl** - controla tu sueño desde la terminal.
- **imsg** - envía, lee y transmite iMessage y SMS.
- **wacli** - CLI de WhatsApp: sincroniza, busca, envía.
- **discord** - acciones de Discord: reacciones, stickers, encuestas. Usa destinos `user:<id>` o `channel:<id>` (los ids numéricos sin prefijo son ambiguos).
- **gog** - CLI de Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - cliente de Spotify en terminal para buscar/poner en cola/controlar la reproducción.
- **sag** - voz de ElevenLabs con UX tipo say de Mac; transmite a los altavoces de forma predeterminada.
- **Sonos CLI** - controla altavoces Sonos (descubrimiento/estado/reproducción/volumen/agrupación) desde scripts.
- **blucli** - reproduce, agrupa y automatiza reproductores BluOS desde scripts.
- **OpenHue CLI** - control de iluminación Philips Hue para escenas y automatizaciones.
- **OpenAI Whisper** - conversión local de voz a texto para dictado rápido y transcripciones de buzón de voz.
- **Gemini CLI** - modelos Google Gemini desde la terminal para preguntas y respuestas rápidas.
- **agent-tools** - kit de utilidades para automatizaciones y scripts auxiliares.

## Notas de uso

- Prefiere la CLI `openclaw` para scripting; la app de escritorio gestiona los permisos.
- Ejecuta instalaciones desde la pestaña Skills; el botón de instalación se oculta cuando un binario requerido ya está presente.
- Mantén los Heartbeats habilitados para que el asistente pueda programar recordatorios, supervisar bandejas de entrada y activar capturas de cámara.
- La UI Canvas se ejecuta a pantalla completa con superposiciones nativas. Evita colocar controles críticos en los bordes superior izquierdo/superior derecho/inferiores; añade márgenes de diseño explícitos en lugar de depender de inserciones de área segura.
- Para verificación controlada por navegador, usa la CLI `openclaw browser` (Plugin `browser` incluido) con el perfil Chrome/Brave/Edge/Chromium gestionado por OpenClaw.
- Gestionar: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Inspeccionar: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Actuar: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Las acciones necesitan una `ref` de `snapshot` (no se aceptan selectores CSS para acciones); usa `evaluate` cuando necesites apuntar con estilo `document.querySelector`.
- Añade `--json` para obtener salida legible por máquina en cualquier comando de inspección.

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Runtime del agente](/es/concepts/agent)
- [Enrutamiento de canales](/es/channels/channel-routing)
