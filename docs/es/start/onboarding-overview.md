---
read_when:
    - Elegir una ruta de incorporación
    - Configuración de un entorno nuevo
sidebarTitle: Onboarding Overview
summary: Descripción general de las opciones y los flujos de incorporación de OpenClaw
title: Descripción general de la incorporación
x-i18n:
    generated_at: "2026-07-16T12:01:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw dispone de incorporación mediante terminal y la aplicación para macOS. Ambas establecen primero la inferencia:
detectan el acceso existente a IA, requieren una finalización en vivo y solo entonces inician
OpenClaw para configurar el resto de la instalación. Un Gateway accesible y configurado
cuyo agente predeterminado ya tenga un modelo configurado omite la incorporación y abre
la interfaz normal del agente. El flujo de terminal también ofrece el asistente clásico completo para
una configuración detallada.

## ¿Qué opción se debe usar?

|                  | Incorporación mediante CLI                    | Incorporación mediante la aplicación para macOS |
| ---------------- | --------------------------------------------- | ----------------------------------------------- |
| **Plataformas**  | macOS, Linux, Windows (nativo o mediante WSL2) | Solo macOS                                      |
| **Interfaz**     | Configuración de inferencia y luego OpenClaw  | Configuración de inferencia y luego OpenClaw    |
| **Ideal para**   | Servidores, entornos sin interfaz gráfica, control total | Equipos Mac de escritorio, configuración visual |
| **Automatización** | `--non-interactive` para scripts             | Solo manual                                     |
| **Comando**      | `openclaw onboard`                            | Iniciar la aplicación                           |

La mayoría de los usuarios deberían comenzar con la **incorporación mediante CLI**, ya que funciona
en todas partes y ofrece el máximo control.

## Qué configura la incorporación

La fase guiada de inferencia establece únicamente:

1. **Proveedor del modelo y autenticación**: acceso detectado o inicio de sesión verificado en un proveedor,
   clave de API o token
2. **Inferencia verificada**: una finalización real en el modelo efectivo
   del agente predeterminado

Una vez superada esa finalización, OpenClaw puede configurar el espacio de trabajo, el Gateway,
el servicio Gateway, los canales, los agentes, los plugins y otras funciones opcionales.

El asistente clásico de la CLI también puede configurar:

1. **Canales** (opcional): canales de chat integrados e incluidos, como
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp y otros
2. **Controles avanzados del Gateway**: modo remoto, ajustes de red y opciones del daemon

## Incorporación mediante CLI

Ejecute en cualquier terminal:

```bash
openclaw onboard
```

El flujo guiado detecta el acceso existente a IA, prueba los candidatos en vivo por orden
y pasa al siguiente si alguno falla. Si se agotan las opciones detectadas, muestra primero OpenAI,
Anthropic, xAI (Grok), Google y OpenRouter. **Más…** contiene los
proveedores restantes organizados en grupos, con regiones, planes y métodos compatibles
mediante navegador, dispositivo, clave de API o token en un segundo menú. Guarda el modelo
y la credencial únicamente después de superar una finalización y luego inicia OpenClaw para
configurar el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y otras funciones
opcionales. **Omitir por ahora** sale sin iniciar OpenClaw. No existe una
transición al flujo clásico dentro del proceso; salga y ejecute `openclaw onboard --classic` si prefiere
usar el asistente clásico.

Una vez superada la inferencia, OpenClaw puede transferir la configuración de canales a un asistente
de terminal con entrada enmascarada. No abre la configuración guiada ni clásica del proveedor; salga de OpenClaw y
ejecute `openclaw onboard` para cambiar el proveedor del modelo o su autenticación.

Use `openclaw onboard --classic` para configurar en detalle el modelo o la autenticación, los canales, las Skills,
el Gateway remoto o la importación. Añadir `--install-daemon` también selecciona el
flujo clásico e instala el servicio en segundo plano en un solo paso. Use `openclaw
openclaw` para realizar la configuración y reparación conversacional no relacionada con la inferencia. `openclaw
onboard --modern` es un alias de compatibilidad que utiliza la misma
puerta de inferencia en vivo.

Referencia completa: [Incorporación (CLI)](/es/start/wizard)
Documentación del comando CLI: [`openclaw onboard`](/es/cli/onboard)

## Incorporación mediante la aplicación para macOS

Abra la aplicación OpenClaw. Si el Gateway local o remoto configurado es accesible
y el agente predeterminado ya tiene un modelo configurado, la aplicación omite la incorporación
y OpenClaw, y abre inmediatamente la interfaz normal del agente.

Para un Gateway nuevo o incompleto, el flujo del primer inicio detecta el acceso existente a IA
(Claude Code, Codex o claves de API), prueba en vivo la mejor
opción y la guarda únicamente después de recibir una respuesta real; cambia automáticamente a otra opción
y ofrece un paso manual verificado para introducir una clave de API cuando no encuentra ninguna. Las credenciales
confidenciales usan entrada enmascarada. Una vez superada la inferencia, OpenClaw se inicia y
ayuda a configurar el resto.

Gemini CLI sigue estando disponible para los agentes normales después de la configuración, pero no se
ofrece para esta puerta de inferencia porque no puede aplicar la prueba sin herramientas.

Referencia completa: [Incorporación (aplicación para macOS)](/es/start/onboarding)

## Proveedores personalizados o no incluidos

Si su proveedor no aparece en la lista, ejecute `openclaw onboard --classic`, elija
**Proveedor personalizado** e introduzca:

- Compatibilidad del endpoint: compatible con OpenAI (`/chat/completions`), compatible con OpenAI Responses (`/responses`), compatible con Anthropic (`/messages`) o desconocida (prueba las tres opciones y la detecta automáticamente)
- URL base y clave de API (la clave de API es opcional si el endpoint no requiere ninguna)
- ID del modelo y alias opcional del modelo

Pueden coexistir varios endpoints personalizados; cada uno obtiene su propio ID de endpoint.

## Contenido relacionado

- [Primeros pasos](/es/start/getting-started)
- [Referencia de configuración mediante CLI](/es/start/wizard-cli-reference)
