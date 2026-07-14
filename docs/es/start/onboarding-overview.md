---
read_when:
    - Elegir una ruta de incorporación
    - Configuración de un entorno nuevo
sidebarTitle: Onboarding Overview
summary: Descripción general de las opciones y los flujos de incorporación de OpenClaw
title: Descripción general de la incorporación
x-i18n:
    generated_at: "2026-07-14T14:10:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e045bbbc4516cf2b89d5867978e9d88d83e744da3794748952375496c06f59c3
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw dispone de incorporación mediante terminal y aplicación para macOS. Ambas establecen primero la inferencia:
detectan el acceso existente a IA, exigen una generación real y solo entonces inician
Crestodian para configurar el resto. Si hay un Gateway accesible y configurado
cuyo agente predeterminado ya tiene un modelo configurado, se omite la incorporación y se abre
la interfaz normal del agente. El flujo del terminal también ofrece el asistente clásico completo para
una configuración detallada.

## ¿Qué opción se debe utilizar?

|                  | Incorporación mediante CLI                       | Incorporación mediante la aplicación para macOS |
| ---------------- | ------------------------------------------------ | ------------------------------------------------ |
| **Plataformas**  | macOS, Linux, Windows (nativo o WSL2)            | Solo macOS                                       |
| **Interfaz**     | Configuración de inferencia y después Crestodian | Configuración de inferencia y después Crestodian |
| **Ideal para**   | Servidores, sistemas sin interfaz gráfica, control total | Mac de escritorio, configuración visual          |
| **Automatización** | `--non-interactive` para scripts                | Solo manual                                      |
| **Comando**      | `openclaw onboard`                               | Iniciar la aplicación                            |

La mayoría de los usuarios deberían comenzar con la **incorporación mediante CLI**, ya que funciona en
todas partes y ofrece el máximo control.

## Qué configura la incorporación

La fase guiada de inferencia establece únicamente:

1. **Proveedor del modelo y autenticación** — acceso detectado o inicio de sesión verificado con el proveedor,
   clave de API o token
2. **Inferencia verificada** — una generación real con el modelo efectivo
   del agente predeterminado

Una vez superada esa generación, Crestodian puede configurar el espacio de trabajo, el Gateway,
el servicio del Gateway, los canales, los agentes, los plugins y otras funciones opcionales.

El asistente clásico de la CLI también puede configurar:

1. **Canales** (opcional) — canales de chat integrados e incluidos, como
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp y otros
2. **Controles avanzados del Gateway** — modo remoto, ajustes de red y opciones del demonio

## Incorporación mediante CLI

Ejecute el siguiente comando en cualquier terminal:

```bash
openclaw onboard
```

El flujo guiado detecta el acceso existente a IA, prueba en vivo los candidatos en orden
y pasa al siguiente si alguno falla. Si se agotan las opciones detectadas, muestra primero OpenAI,
Anthropic, xAI (Grok), Google y OpenRouter. **More…** contiene los
proveedores restantes agrupados por proveedor, con regiones, planes y métodos compatibles
mediante navegador, dispositivo, clave de API o token en un segundo menú. Guarda el modelo
y la credencial solo después de una generación satisfactoria; a continuación, inicia Crestodian para
configurar el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y otras
funciones opcionales. **Skip for now** sale sin iniciar Crestodian. No hay
ninguna transición al flujo clásico dentro del proceso; salga y ejecute `openclaw onboard --classic` cuando prefiera
utilizar el asistente clásico.

Una vez superada la inferencia, Crestodian puede transferir la configuración de canales a un asistente
de terminal con entrada oculta. No abre la configuración guiada ni clásica del proveedor; salga de Crestodian y
ejecute `openclaw onboard` para cambiar el proveedor del modelo o su autenticación.

Utilice `openclaw onboard --classic` para configurar detalladamente el modelo y la autenticación, los canales, las Skills,
el Gateway remoto o la importación. Añadir `--install-daemon` también selecciona el
flujo clásico e instala el servicio en segundo plano en un solo paso. Utilice `openclaw
crestodian` para la configuración conversacional no relacionada con la inferencia y para reparaciones. `openclaw
onboard --modern` es un alias de compatibilidad que utiliza la misma
comprobación de inferencia en vivo.

Referencia completa: [Incorporación (CLI)](/es/start/wizard)
Documentación del comando de la CLI: [`openclaw onboard`](/es/cli/onboard)

## Incorporación mediante la aplicación para macOS

Abra la aplicación OpenClaw. Si su Gateway local o remoto configurado está accesible
y el agente predeterminado ya tiene un modelo configurado, la aplicación omite la incorporación
y Crestodian, y abre inmediatamente la interfaz normal del agente.

En un Gateway nuevo o incompleto, el flujo del primer inicio detecta el acceso existente a
IA (Claude Code, Codex o claves de API), prueba en vivo la mejor
opción y la guarda solo después de obtener una respuesta real; cambia automáticamente a otras opciones
y ofrece un paso manual verificado para introducir una clave de API cuando no encuentra ninguna. Las
credenciales confidenciales se introducen mediante campos ocultos. Una vez superada la inferencia, Crestodian se inicia y
ayuda a configurar el resto.

Gemini CLI sigue estando disponible para los agentes normales después de la configuración, pero no se
ofrece para esta comprobación de inferencia porque no puede imponer una prueba sin herramientas.

Referencia completa: [Incorporación (aplicación para macOS)](/es/start/onboarding)

## Proveedores personalizados o no incluidos

Si el proveedor no aparece en la lista, ejecute `openclaw onboard --classic`, seleccione
**Custom Provider** e introduzca:

- Compatibilidad del endpoint: compatible con OpenAI (`/chat/completions`), compatible con OpenAI Responses (`/responses`), compatible con Anthropic (`/messages`) o desconocida (prueba las tres opciones y la detecta automáticamente)
- URL base y clave de API (la clave de API es opcional si el endpoint no la requiere)
- ID del modelo y alias opcional del modelo

Pueden coexistir varios endpoints personalizados; cada uno recibe su propio ID de endpoint.

## Contenido relacionado

- [Primeros pasos](/es/start/getting-started)
- [Referencia de configuración mediante CLI](/es/start/wizard-cli-reference)
