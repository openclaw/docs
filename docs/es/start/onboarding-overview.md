---
read_when:
    - Elegir una ruta de incorporación
    - Configurar un entorno nuevo
sidebarTitle: Onboarding Overview
summary: Descripción general de las opciones y los flujos de incorporación de OpenClaw
title: Descripción general de la incorporación
x-i18n:
    generated_at: "2026-07-05T17:42:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c41a83d23341504ef8c8279530c33a7e9b73c466eb7128775756acd800849e61
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw tiene dos rutas de incorporación. Ambas configuran la autenticación, el Gateway y
canales de chat opcionales; solo difieren en cómo interactúas con la configuración.

## ¿Qué ruta debo usar?

|                | Incorporación por CLI                  | Incorporación en la app de macOS |
| -------------- | -------------------------------------- | -------------------------------- |
| **Plataformas** | macOS, Linux, Windows (nativo o WSL2) | Solo macOS                       |
| **Interfaz**   | Asistente en terminal                  | UI guiada + chat de Crestodian   |
| **Ideal para** | Servidores, sin interfaz gráfica, control total | Mac de escritorio, configuración visual |
| **Automatización** | `--non-interactive` para scripts  | Solo manual                      |
| **Comando**    | `openclaw onboard`                     | Iniciar la app                   |

La mayoría de los usuarios debería empezar con la **incorporación por CLI**: funciona en todas partes y te da
el mayor control.

## Qué configura la incorporación

Independientemente de la ruta que elijas, la incorporación configura:

1. **Proveedor de modelo y autenticación**: clave de API, OAuth o token de configuración para el proveedor elegido
2. **Espacio de trabajo**: directorio para archivos de agentes, plantillas de arranque y memoria
3. **Gateway**: puerto, dirección de enlace, modo de autenticación
4. **Canales** (opcional): canales de chat integrados y empaquetados, como
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp y más
5. **Daemon** (opcional): servicio en segundo plano para que el Gateway se inicie automáticamente

## Incorporación por CLI

Ejecuta en cualquier terminal:

```bash
openclaw onboard
```

Añade `--install-daemon` para instalar también el servicio en segundo plano en un solo paso.

Referencia completa: [Incorporación (CLI)](/es/start/wizard)
Documentación del comando CLI: [`openclaw onboard`](/es/cli/onboard)

## Incorporación en la app de macOS

Abre la app OpenClaw. Para la configuración local, el flujo de primera ejecución inicia el Gateway,
detecta el acceso de IA existente (Claude Code, Codex, Gemini CLI o claves de API),
prueba en vivo la mejor opción y la guarda solo después de una respuesta real; recurre
automáticamente a alternativas y ofrece un paso manual verificado con clave de API cuando no se
encuentra nada. Las credenciales sensibles usan entrada enmascarada. En cambio, la configuración remota se conecta a un
Gateway ya configurado, y la misma comprobación de IA se ejecuta contra ese
Gateway.

Referencia completa: [Incorporación (app de macOS)](/es/start/onboarding)

## Proveedores personalizados o no listados

Si tu proveedor no aparece en la incorporación, elige **Proveedor personalizado** e
introduce:

- Compatibilidad del endpoint: compatible con OpenAI (`/chat/completions`), compatible con OpenAI Responses (`/responses`), compatible con Anthropic (`/messages`) o desconocida (prueba los tres y lo detecta automáticamente)
- URL base y clave de API (la clave de API es opcional si el endpoint no requiere una)
- ID de modelo y alias de modelo opcional

Pueden coexistir varios endpoints personalizados: cada uno obtiene su propio ID de endpoint.

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [Referencia de configuración por CLI](/es/start/wizard-cli-reference)
