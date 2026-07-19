---
read_when:
    - Qué sucede en la primera ejecución del agente
    - Explicación de dónde se encuentran los archivos de arranque
    - Depuración de la configuración de identidad durante la incorporación
sidebarTitle: Bootstrapping
summary: Ritual de inicialización del agente que prepara el espacio de trabajo y los archivos de identidad
title: Inicialización del agente
x-i18n:
    generated_at: "2026-07-19T02:06:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c065534b5abe539cccfe8badc44296d890289d8ce3daa9f03a12e82adf8c091
    source_path: start/bootstrapping.md
    workflow: 16
---

El arranque inicial es el ritual de la primera ejecución que prepara un nuevo espacio de trabajo del agente y
guía al agente en la elección de una identidad. Se ejecuta una sola vez, justo después de
la incorporación, en el primer turno real del agente.

## Qué sucede

En la primera ejecución con un espacio de trabajo totalmente nuevo (valor predeterminado `~/.openclaw/workspace`),
OpenClaw:

- Crea `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- Hace que el agente siga una secuencia de nacimiento limitada a tres pasos: propone su propio
  nombre, comparte una breve frase sobre su esencia o estilo y pregunta si se prefiere el conjunto
  mínimo recomendado de plugins o la máxima comodidad.
- Guarda dos veces la identidad acordada: en `IDENTITY.md` y `SOUL.md` (lo que el
  agente lee sobre sí mismo) y mediante `openclaw agents set-identity` (lo que muestran los canales
  y la interfaz de usuario).
- Lee las recomendaciones de aplicaciones ya almacenadas durante la incorporación sin volver a examinarlas.
  Los plugins oficiales usan `openclaw plugins install <id>`; las Skills de ClawHub de terceros
  siguen requiriendo una aceptación explícita. Tras procesar la elección, el agente
  confirma la oferta almacenada para no volver a preguntar.
- Elimina `BOOTSTRAP.md` cuando el espacio de trabajo parece configurado, de modo que el ritual solo se ejecute una vez.

Un espacio de trabajo se considera configurado cuando `SOUL.md`, `IDENTITY.md` o `USER.md` se ha
desviado de su plantilla inicial, o cuando existe una carpeta `memory/`.

<Note>
`BOOTSTRAP.md` abarca toda la conversación sobre la identidad. Consulte su contenido en
[Plantilla BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP).
</Note>

## Ejecuciones con modelos integrados y locales

Para las ejecuciones con modelos integrados o locales, OpenClaw mantiene `BOOTSTRAP.md` fuera del
contexto privilegiado del sistema. En la primera ejecución interactiva principal, aún
pasa el contenido del archivo mediante el prompt del usuario, por lo que los modelos que no
usan de forma fiable la herramienta `read` pueden completar el ritual. Si la ejecución
actual no puede acceder de forma segura al espacio de trabajo, el agente recibe una breve nota
de arranque inicial limitado en lugar de un saludo genérico.

## Omitir el arranque inicial

Para omitirlo en un espacio de trabajo preparado previamente, ejecute:

```bash
openclaw onboard --skip-bootstrap
```

## Dónde se ejecuta

El arranque inicial siempre se ejecuta en el host del Gateway. Si la aplicación para macOS se conecta a un
Gateway remoto, el espacio de trabajo y sus archivos de arranque inicial residen en esa máquina
remota, no en el Mac.

<Note>
Cuando el Gateway se ejecuta en otra máquina, edite los archivos del espacio de trabajo en el host del Gateway
(por ejemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentación relacionada

- Incorporación en la aplicación para macOS: [Incorporación](/es/start/onboarding)
- Estructura del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- Contenido de la plantilla: [Plantilla BOOTSTRAP.md](/es/reference/templates/BOOTSTRAP)
