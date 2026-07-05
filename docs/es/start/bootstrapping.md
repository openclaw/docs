---
read_when:
    - Entender qué ocurre en la primera ejecución del agente
    - Explicación de dónde se encuentran los archivos de inicialización
    - Depurar la configuración de identidad de incorporación
sidebarTitle: Bootstrapping
summary: Ritual de inicialización del agente que prepara el espacio de trabajo y los archivos de identidad
title: Arranque del agente
x-i18n:
    generated_at: "2026-07-05T11:42:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

El arranque inicial es el ritual de primera ejecución que prepara un nuevo espacio de trabajo del agente y
guía al agente para elegir una identidad. Se ejecuta una vez, justo después de
la incorporación, en el primer turno real del agente.

## Qué ocurre

En la primera ejecución contra un espacio de trabajo completamente nuevo (predeterminado `~/.openclaw/workspace`),
OpenClaw:

- Inicializa `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- Hace que el agente siga `BOOTSTRAP.md`: una conversación de formato libre (no un formulario fijo de preguntas y respuestas) para decidir un nombre, una personalidad y un tono.
- Escribe lo que aprende en `IDENTITY.md`, `USER.md` y `SOUL.md`.
- Elimina `BOOTSTRAP.md` una vez que el espacio de trabajo parece configurado, para que el ritual solo se ejecute una vez.

Un espacio de trabajo cuenta como configurado una vez que `SOUL.md`, `IDENTITY.md` o `USER.md` se ha
desviado de su plantilla inicial, o existe una carpeta `memory/`.

<Note>
`BOOTSTRAP.md` cubre toda la conversación de identidad. Consulta su contenido en
[plantilla de BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP).
</Note>

## Ejecuciones con modelos integrados y locales

Para ejecuciones con modelos integrados o locales, OpenClaw mantiene `BOOTSTRAP.md` fuera del
contexto de sistema privilegiado. En la primera ejecución interactiva principal, aun así
pasa el contenido del archivo a través del prompt de usuario, de modo que los modelos que no
llaman de forma fiable a la herramienta `read` todavía puedan completar el ritual. Si la ejecución
actual no puede acceder de forma segura al espacio de trabajo, el agente recibe una nota breve de arranque limitado
en lugar de un saludo genérico.

## Omitir el arranque inicial

Para omitir esto en un espacio de trabajo previamente preparado, ejecuta:

```bash
openclaw onboard --skip-bootstrap
```

## Dónde se ejecuta

El arranque inicial siempre se ejecuta en el host del Gateway. Si la app de macOS se conecta a un
Gateway remoto, el espacio de trabajo y sus archivos de arranque inicial viven en esa máquina
remota, no en el Mac.

<Note>
Cuando el Gateway se ejecuta en otra máquina, edita los archivos del espacio de trabajo en el host del gateway
(por ejemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentos relacionados

- Incorporación de la app de macOS: [Incorporación](/es/start/onboarding)
- Diseño del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- Contenido de la plantilla: [plantilla de BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP)
