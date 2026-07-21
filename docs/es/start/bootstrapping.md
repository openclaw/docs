---
read_when:
    - Comprender qué sucede en la primera ejecución del agente
    - Explicación de dónde se encuentran los archivos de arranque
    - Depuración de la configuración de identidad durante la incorporación
sidebarTitle: Bootstrapping
summary: Ritual de inicialización del agente que prepara el espacio de trabajo y los archivos de identidad
title: Inicialización del agente
x-i18n:
    generated_at: "2026-07-21T09:01:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: efb47e1a6a86d68aef1aa1662fe9c5def9a4e5b45649b84aeb9060bfcba21a5d
    source_path: start/bootstrapping.md
    workflow: 16
---

El arranque inicial es el ritual de la primera ejecución que prepara un nuevo espacio de trabajo del agente y
guía al agente para elegir una identidad. Se ejecuta una sola vez, justo después
de la incorporación, en el primer turno real del agente.

## Qué ocurre

En la primera ejecución con un espacio de trabajo completamente nuevo (valor predeterminado `~/.openclaw/workspace`),
OpenClaw:

- Crea `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- Hace que el agente siga una secuencia de nacimiento limitada a tres pasos: pregunta cómo se desea
  llamarlo, comparte una breve frase sobre su esencia o estilo y pregunta si se prefiere el
  conjunto mínimo recomendado de plugins o la máxima comodidad.
- Guarda dos veces la identidad acordada: en `IDENTITY.md` y `SOUL.md` (lo que el
  agente lee sobre sí mismo) y mediante `openclaw agents set-identity` (lo que muestran los canales
  y la interfaz de usuario).
- Lee las recomendaciones de aplicaciones ya almacenadas durante la incorporación sin volver a examinarlas.
  Los plugins oficiales usan `openclaw plugins install <id>`; las Skills de terceros de ClawHub
  siguen requiriendo una aceptación explícita. Después de gestionar la elección, el agente
  confirma la oferta almacenada para no volver a preguntar.
- Elimina `BOOTSTRAP.md` cuando el espacio de trabajo parece estar configurado, de modo que el ritual solo se ejecuta una vez.

Un espacio de trabajo se considera configurado cuando `SOUL.md`, `IDENTITY.md` o `USER.md` se ha
desviado de su plantilla inicial, o si existe una carpeta `memory/`.

<Note>
`BOOTSTRAP.md` abarca toda la conversación sobre la identidad. Consulte su contenido en
[Plantilla de BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP).
</Note>

## Ejecuciones con modelos integrados y locales

Para las ejecuciones con modelos integrados o locales, OpenClaw mantiene `BOOTSTRAP.md` fuera del
contexto privilegiado del sistema. En la primera ejecución interactiva principal, sigue
pasando el contenido del archivo mediante el mensaje del usuario, por lo que los modelos que no
llaman de forma fiable a la herramienta `read` pueden completar el ritual. Si la ejecución actual
no puede acceder de forma segura al espacio de trabajo, el agente recibe una breve nota de arranque
limitado en lugar de un saludo genérico.

## Omitir el arranque inicial

Para omitirlo en un espacio de trabajo preparado previamente, ejecute:

```bash
openclaw onboard --skip-bootstrap
```

## Dónde se ejecuta

El arranque inicial siempre se ejecuta en el host del Gateway. Si la aplicación para macOS se conecta a un
Gateway remoto, el espacio de trabajo y sus archivos de arranque residen en esa máquina
remota, no en el Mac.

<Note>
Cuando el Gateway se ejecuta en otra máquina, edite los archivos del espacio de trabajo en el host del gateway
(por ejemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentación relacionada

- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Estructura del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- Contenido de la plantilla: [Plantilla de BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP)
