---
read_when:
    - Comprender qué ocurre en la primera ejecución del agente
    - Explicación de dónde se encuentran los archivos de inicialización
    - Depuración de la configuración de identidad durante la incorporación
sidebarTitle: Bootstrapping
summary: Ritual de inicialización del agente que prepara el espacio de trabajo y los archivos de identidad
title: Inicialización del agente
x-i18n:
    generated_at: "2026-04-30T06:02:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

La inicialización es el ritual de **primera ejecución** que prepara el espacio de trabajo de un agente y
recopila detalles de identidad. Ocurre después de la incorporación, cuando el agente se inicia
por primera vez.

## Qué hace la inicialización

En la primera ejecución del agente, OpenClaw inicializa el espacio de trabajo (predeterminado
`~/.openclaw/workspace`):

- Crea `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Ejecuta un breve ritual de preguntas y respuestas (una pregunta a la vez).
- Escribe la identidad y las preferencias en `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Elimina `BOOTSTRAP.md` al terminar para que solo se ejecute una vez.

En ejecuciones con modelos integrados/locales, OpenClaw mantiene `BOOTSTRAP.md` fuera del
contexto privilegiado del sistema. En la primera ejecución interactiva principal, aún pasa
el contenido del archivo en el prompt de usuario para que los modelos que no llaman de forma fiable a la
herramienta `read` puedan completar el ritual. Si la ejecución actual no puede acceder de forma segura al
espacio de trabajo, el agente recibe una nota de inicialización limitada en lugar de un saludo genérico.

## Omitir la inicialización

Para omitir esto en un espacio de trabajo preconfigurado, ejecuta `openclaw onboard --skip-bootstrap`.

## Dónde se ejecuta

La inicialización siempre se ejecuta en el **host del Gateway**. Si la app para macOS se conecta a
un Gateway remoto, el espacio de trabajo y los archivos de inicialización residen en esa máquina
remota.

<Note>
Cuando el Gateway se ejecuta en otra máquina, edita los archivos del espacio de trabajo en el host del Gateway
(por ejemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentos relacionados

- Incorporación en la app para macOS: [Incorporación](/es/start/onboarding)
- Diseño del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
