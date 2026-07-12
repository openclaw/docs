---
read_when:
    - Elegir una ruta de incorporación
    - Configuración de un entorno nuevo
sidebarTitle: Onboarding Overview
summary: Descripción general de las opciones y los flujos de incorporación de OpenClaw
title: Descripción general de la incorporación
x-i18n:
    generated_at: "2026-07-11T23:31:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw ofrece incorporación mediante terminal y mediante la aplicación para macOS. Ambas establecen primero la inferencia:
detectan el acceso existente a la IA, requieren una finalización en vivo y solo entonces inician
Crestodian para configurar el resto. Si hay un Gateway accesible y configurado
cuyo agente predeterminado ya tiene un modelo configurado, se omite la incorporación y se abre
la interfaz normal del agente. El flujo de terminal también ofrece el asistente clásico completo para
una configuración detallada.

## ¿Qué opción debo usar?

|                  | Incorporación mediante CLI                     | Incorporación mediante la aplicación para macOS |
| ---------------- | ---------------------------------------------- | ------------------------------------------------ |
| **Plataformas**  | macOS, Linux, Windows (nativo o WSL2)          | Solo macOS                                       |
| **Interfaz**     | Configuración de inferencia y luego Crestodian | Configuración de inferencia y luego Crestodian   |
| **Ideal para**   | Servidores, entornos sin interfaz gráfica, control total | Mac de escritorio, configuración visual   |
| **Automatización** | `--non-interactive` para scripts             | Solo manual                                      |
| **Comando**      | `openclaw onboard`                             | Iniciar la aplicación                            |

La mayoría de los usuarios deberían comenzar con la **incorporación mediante CLI**, ya que funciona en
todas partes y ofrece el máximo control.

## Qué configura la incorporación

La fase guiada de inferencia establece únicamente:

1. **Proveedor del modelo y autenticación** — acceso detectado o una clave de API verificada
2. **Inferencia verificada** — una finalización real con el modelo efectivo del
   agente predeterminado

Una vez superada esa finalización, Crestodian puede configurar el espacio de trabajo, el Gateway,
el servicio Gateway, los canales, los agentes, los plugins y otras funciones opcionales.

El asistente clásico de la CLI también puede configurar:

1. **Canales** (opcional) — canales de chat integrados e incluidos, como
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp y otros
2. **Controles avanzados del Gateway** — modo remoto, configuración de red y opciones del servicio en segundo plano

## Incorporación mediante CLI

Ejecute lo siguiente en cualquier terminal:

```bash
openclaw onboard
```

El flujo guiado detecta el acceso existente a la IA, prueba en vivo los candidatos en orden,
pasa al siguiente si se produce un error y ofrece la introducción manual enmascarada de la clave. Solo guarda
el modelo y la credencial después de una finalización correcta; a continuación, inicia Crestodian
para configurar el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y otras
funciones opcionales. No hay ningún Crestodian previo a la inferencia, ninguna opción para omitir la IA ni
ningún traspaso al asistente clásico durante el flujo. Salga y ejecute `openclaw onboard --classic` cuando
prefiera usar el asistente clásico.

Una vez superada la inferencia, Crestodian puede transferir la configuración de canales a un asistente de
terminal con entrada enmascarada. No abre la configuración guiada ni clásica del proveedor; salga de Crestodian y
ejecute `openclaw onboard` para cambiar el proveedor del modelo o su autenticación.

Use `openclaw onboard --classic` para configurar en detalle el modelo y la autenticación, los canales, las Skills,
el Gateway remoto o la importación. Añadir `--install-daemon` también selecciona el
flujo clásico e instala el servicio en segundo plano en un solo paso. Use `openclaw
crestodian` para realizar mediante conversación tareas de configuración y reparación no relacionadas con la inferencia. `openclaw
onboard --modern` es un alias de compatibilidad que utiliza la misma
comprobación de inferencia en vivo.

Referencia completa: [Incorporación (CLI)](/es/start/wizard)
Documentación del comando CLI: [`openclaw onboard`](/es/cli/onboard)

## Incorporación mediante la aplicación para macOS

Abra la aplicación OpenClaw. Si su Gateway local o remoto configurado es accesible
y el agente predeterminado ya tiene un modelo configurado, la aplicación omite la incorporación
y Crestodian, y abre de inmediato la interfaz normal del agente.

Para un Gateway nuevo o incompleto, el flujo de primera ejecución detecta el acceso existente a la IA
(Claude Code, Codex o claves de API), prueba en vivo la mejor
opción y solo la guarda después de recibir una respuesta real; si falla, recurre automáticamente a otra opción y
ofrece un paso verificado para introducir manualmente una clave de API cuando no encuentra ninguna. Las
credenciales confidenciales se introducen mediante campos enmascarados. Una vez superada la inferencia, Crestodian se inicia y
ayuda a configurar el resto.

Gemini CLI sigue estando disponible para los agentes normales después de la configuración, pero no se
ofrece para esta comprobación de inferencia porque no puede aplicar la prueba sin herramientas.

Referencia completa: [Incorporación (aplicación para macOS)](/es/start/onboarding)

## Proveedores personalizados o no incluidos

Si su proveedor no aparece en la lista, ejecute `openclaw onboard --classic`, elija
**Proveedor personalizado** e introduzca:

- Compatibilidad del endpoint: compatible con OpenAI (`/chat/completions`), compatible con OpenAI Responses (`/responses`), compatible con Anthropic (`/messages`) o desconocida (prueba las tres opciones y la detecta automáticamente)
- URL base y clave de API (la clave de API es opcional si el endpoint no la requiere)
- ID del modelo y alias opcional del modelo

Pueden coexistir varios endpoints personalizados; cada uno recibe su propio ID de endpoint.

## Contenido relacionado

- [Primeros pasos](/es/start/getting-started)
- [Referencia de configuración mediante CLI](/es/start/wizard-cli-reference)
