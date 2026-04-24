---
read_when:
    - Entender qué ocurre en la primera ejecución del agente
    - Explicar dónde viven los archivos de inicialización user
    - Depurar la configuración de identidad durante onboarding
sidebarTitle: Bootstrapping
summary: Ritual de inicialización del agente que prepara el espacio de trabajo y los archivos de identidad
title: Inicialización del agente
x-i18n:
    generated_at: "2026-04-24T05:50:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

La inicialización es el ritual de **primera ejecución** que prepara un espacio de trabajo del agente y recopila detalles de identidad. Ocurre después de onboarding, cuando el agente se inicia por primera vez.

## Qué hace la inicialización

En la primera ejecución del agente, OpenClaw inicializa el espacio de trabajo (predeterminado
`~/.openclaw/workspace`):

- Prepara `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Ejecuta un breve ritual de preguntas y respuestas (una pregunta cada vez).
- Escribe identidad + preferencias en `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Elimina `BOOTSTRAP.md` al terminar para que se ejecute solo una vez.

## Dónde se ejecuta

La inicialización siempre se ejecuta en el **host del gateway**. Si la app de macOS se conecta a
un Gateway remoto, el espacio de trabajo y los archivos de inicialización viven en esa máquina
remota.

<Note>
Cuando el Gateway se ejecuta en otra máquina, edita los archivos del espacio de trabajo en el host del gateway (por ejemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentación relacionada

- Onboarding de la app de macOS: [Onboarding](/es/start/onboarding)
- Estructura del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
