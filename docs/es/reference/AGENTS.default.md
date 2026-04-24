---
read_when:
    - Iniciar una nueva sesión de agente de OpenClaw
    - Habilitar o auditar Skills predeterminadas
summary: Instrucciones predeterminadas del agente de OpenClaw y lista de Skills para la configuración de asistente personal
title: AGENTS.md predeterminado
x-i18n:
    generated_at: "2026-04-24T05:47:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Asistente personal de OpenClaw (predeterminado)

## Primera ejecución (recomendado)

OpenClaw usa un directorio de espacio de trabajo dedicado para el agente. Predeterminado: `~/.openclaw/workspace` (configurable mediante `agents.defaults.workspace`).

1. Crea el espacio de trabajo (si aún no existe):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copia las plantillas predeterminadas del espacio de trabajo al espacio de trabajo:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: si quieres la lista de Skills del asistente personal, reemplaza AGENTS.md con este archivo:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcional: elige un espacio de trabajo diferente configurando `agents.defaults.workspace` (admite `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Valores predeterminados de seguridad

- No vuelques directorios ni secretos en el chat.
- No ejecutes comandos destructivos salvo que se solicite explícitamente.
- No envíes respuestas parciales o en streaming a superficies externas de mensajería (solo respuestas finales).

## Inicio de sesión (obligatorio)

- Lee `SOUL.md`, `USER.md` y hoy+ayer en `memory/`.
- Lee `MEMORY.md` cuando exista.
- Hazlo antes de responder.

## Alma (obligatorio)

- `SOUL.md` define identidad, tono y límites. Mantenlo actualizado.
- Si cambias `SOUL.md`, díselo al usuario.
- Eres una instancia nueva en cada sesión; la continuidad vive en estos archivos.

## Espacios compartidos (recomendado)

- No eres la voz del usuario; ten cuidado en chats de grupo o canales públicos.
- No compartas datos privados, información de contacto ni notas internas.

## Sistema de memory (recomendado)

- Registro diario: `memory/YYYY-MM-DD.md` (crea `memory/` si hace falta).
- Memory a largo plazo: `MEMORY.md` para hechos duraderos, preferencias y decisiones.
- `memory.md` en minúsculas es solo una entrada heredada de reparación; no mantengas ambos archivos raíz a propósito.
- Al iniciar sesión, lee hoy + ayer + `MEMORY.md` cuando exista.
- Captura: decisiones, preferencias, restricciones, temas abiertos.
- Evita secretos salvo que se soliciten explícitamente.

## Herramientas y Skills

- Las herramientas viven en Skills; sigue el `SKILL.md` de cada Skill cuando la necesites.
- Mantén las notas específicas del entorno en `TOOLS.md` (Notas para Skills).

## Consejo de copia de seguridad (recomendado)

Si tratas este espacio de trabajo como la “memory” de Clawd, conviértelo en un repositorio git (idealmente privado) para que `AGENTS.md` y tus archivos de memory tengan copia de seguridad.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opcional: añade un remoto privado + haz push
```

## Qué hace OpenClaw

- Ejecuta el gateway de WhatsApp + el agente de programación Pi para que el asistente pueda leer/escribir chats, recuperar contexto y ejecutar Skills mediante el Mac anfitrión.
- La app de macOS gestiona permisos (grabación de pantalla, notificaciones, micrófono) y expone la CLI `openclaw` mediante su binario incluido.
- Los chats directos se contraen en la sesión `main` del agente de forma predeterminada; los grupos permanecen aislados como `agent:<agentId>:<channel>:group:<id>` (salas/canales: `agent:<agentId>:<channel>:channel:<id>`); los Heartbeats mantienen vivas las tareas en segundo plano.

## Skills principales (habilitar en Settings → Skills)

- **mcporter** — Runtime/CLI de servidor de herramientas para gestionar backends externos de Skills.
- **Peekaboo** — Capturas rápidas de pantalla en macOS con análisis opcional de visión por IA.
- **camsnap** — Captura fotogramas, clips o alertas de movimiento desde cámaras de seguridad RTSP/ONVIF.
- **oracle** — CLI de agente preparada para OpenAI con repetición de sesiones y control del navegador.
- **eightctl** — Controla tu sueño desde la terminal.
- **imsg** — Envía, lee y transmite iMessage y SMS.
- **wacli** — CLI de WhatsApp: sincronizar, buscar, enviar.
- **discord** — Acciones de Discord: reacciones, stickers, encuestas. Usa objetivos `user:<id>` o `channel:<id>` (los ids numéricos simples son ambiguos).
- **gog** — CLI de Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Cliente de Spotify en terminal para buscar/encolar/controlar reproducción.
- **sag** — Voz de ElevenLabs con experiencia de `say` al estilo Mac; transmite a los altavoces de forma predeterminada.
- **Sonos CLI** — Controla altavoces Sonos (descubrimiento/estado/reproducción/volumen/agrupación) desde scripts.
- **blucli** — Reproduce, agrupa y automatiza reproductores BluOS desde scripts.
- **OpenHue CLI** — Control de iluminación Philips Hue para escenas y automatizaciones.
- **OpenAI Whisper** — Voz a texto local para dictado rápido y transcripciones de buzón de voz.
- **Gemini CLI** — Modelos Gemini de Google desde la terminal para preguntas y respuestas rápidas.
- **agent-tools** — Kit de utilidades para automatizaciones y scripts auxiliares.

## Notas de uso

- Prefiere la CLI `openclaw` para scripting; la app de Mac gestiona los permisos.
- Ejecuta instalaciones desde la pestaña Skills; oculta el botón si un binario ya está presente.
- Mantén los Heartbeats habilitados para que el asistente pueda programar recordatorios, supervisar bandejas de entrada y activar capturas de cámara.
- La UI de canvas se ejecuta a pantalla completa con superposiciones nativas. Evita colocar controles críticos en los bordes superior izquierdo/superior derecho/inferiores; añade márgenes explícitos en el diseño y no dependas de safe-area insets.
- Para verificación impulsada por navegador, usa `openclaw browser` (tabs/status/screenshot) con el perfil Chrome gestionado por OpenClaw.
- Para inspección del DOM, usa `openclaw browser eval|query|dom|snapshot` (y `--json`/`--out` cuando necesites salida automática).
- Para interacciones, usa `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type requieren refs de snapshot; usa `evaluate` para selectores CSS).

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Runtime del agente](/es/concepts/agent)
