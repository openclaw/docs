---
read_when:
    - Qué sucede en la primera ejecución del agente
    - Explicación de dónde se encuentran los archivos de inicialización
    - Depuración de la configuración de identidad durante la incorporación
sidebarTitle: Bootstrapping
summary: Ritual de arranque del agente que inicializa el espacio de trabajo y los archivos de identidad
title: Inicialización del agente
x-i18n:
    generated_at: "2026-07-11T23:32:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

El arranque inicial es el ritual de la primera ejecución que prepara un nuevo espacio de trabajo del agente y
guía al agente para que elija una identidad. Se ejecuta una sola vez, justo después
de la incorporación, en el primer turno real del agente.

## Qué sucede

En la primera ejecución con un espacio de trabajo completamente nuevo (de forma predeterminada, `~/.openclaw/workspace`),
OpenClaw:

- Crea `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- Hace que el agente siga `BOOTSTRAP.md`: una conversación abierta (no un formulario fijo de preguntas y respuestas) para acordar un nombre, una personalidad y un estilo.
- Escribe lo que aprende en `IDENTITY.md`, `USER.md` y `SOUL.md`.
- Elimina `BOOTSTRAP.md` una vez que el espacio de trabajo parece estar configurado, para que el ritual solo se ejecute una vez.

Un espacio de trabajo se considera configurado cuando `SOUL.md`, `IDENTITY.md` o `USER.md`
difiere de su plantilla inicial, o cuando existe una carpeta `memory/`.

<Note>
`BOOTSTRAP.md` abarca toda la conversación sobre la identidad. Consulte su contenido en
[la plantilla de BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP).
</Note>

## Ejecuciones con modelos integrados y locales

En las ejecuciones con modelos integrados o locales, OpenClaw mantiene `BOOTSTRAP.md` fuera del
contexto privilegiado del sistema. En la primera ejecución interactiva principal, aun así
pasa el contenido del archivo mediante el mensaje del usuario, para que los modelos que no
utilizan de forma fiable la herramienta `read` puedan completar el ritual. Si la ejecución actual
no puede acceder de forma segura al espacio de trabajo, el agente recibe una breve nota de arranque
limitado en lugar de un saludo genérico.

## Omitir el arranque inicial

Para omitirlo en un espacio de trabajo preparado previamente, ejecute:

```bash
openclaw onboard --skip-bootstrap
```

## Dónde se ejecuta

El arranque inicial siempre se ejecuta en el host del Gateway. Si la aplicación para macOS se conecta a un
Gateway remoto, el espacio de trabajo y sus archivos de arranque se encuentran en esa máquina
remota, no en el Mac.

<Note>
Cuando el Gateway se ejecuta en otra máquina, edite los archivos del espacio de trabajo en el host del Gateway
(por ejemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentación relacionada

- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Estructura del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- Contenido de la plantilla: [Plantilla de BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP)
